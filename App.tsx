
import React, { useState, useEffect } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { ImageViewer } from './components/ImageViewer';
import { AppState } from './types';
import { DATASETS, PRESET_LOCATIONS, INITIAL_WIDTH } from './constants';
import { generateSatelliteImage, GeneratedData, getCollectionRange, getAvailableDates, getNeighborDate } from './services/jaxaService';
import { X } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    collection: DATASETS[0].collection,
    band: DATASETS[0].band,
    bbox: PRESET_LOCATIONS[1].bbox, // Default to Japan
    minInfo: DATASETS[0].min,
    maxInfo: DATASETS[0].max,
    colorPalette: DATASETS[0].defaultPalette,
    opacity: 0.8,
    language: 'ja',
    currentDateId: null,
  });

  const [generatedData, setGeneratedData] = useState<GeneratedData | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDateList, setShowDateList] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false); // New selection mode state
  
  // Base width for requests (adjusted by screen size)
  const [baseWidth, setBaseWidth] = useState(INITIAL_WIDTH);

  useEffect(() => {
    const handleResize = () => {
      setBaseWidth(Math.min(Math.floor(window.innerWidth * 0.7), 1200));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleUpdateState = (newState: Partial<AppState>) => {
    // If bbox changes, clear data immediately to prevent projection mismatch during debounce
    if (newState.bbox) {
      setGeneratedData(null);
    }
    setAppState((prev) => ({ ...prev, ...newState }));
  };

  const toggleLanguage = () => {
    setAppState(prev => ({ ...prev, language: prev.language === 'en' ? 'ja' : 'en' }));
  };

  useEffect(() => {
    setAvailableDates([]);
    setGeneratedData(null); 
  }, [appState.collection]);

  const fetchSatelliteData = async (
    currentBbox: AppState['bbox'],
    currentConfig: AppState,
    targetDateId?: string | null
  ) => {
    setLoading(true);
    setError(null);
    setGeneratedData(null); // Clear previous data while loading new one

    try {
      const bboxWidth = currentBbox[2] - currentBbox[0];
      const bboxHeight = currentBbox[3] - currentBbox[1];
      const aspect = bboxWidth / bboxHeight;
      
      const reqWidth = baseWidth;
      const reqHeight = Math.round(reqWidth / aspect);

      const datasetConfig = DATASETS.find(d => d.collection === currentConfig.collection);
      const hasTime = datasetConfig?.hasTimeDimension ?? true;

      let dateIdToUse = targetDateId;

      if (hasTime) {
        if (availableDates.length === 0) {
           try {
             const dates = await getAvailableDates(currentConfig.collection);
             setAvailableDates(dates);
             if (!dateIdToUse && dates.length > 0) {
               dateIdToUse = dates[dates.length - 1]; 
               setAppState(prev => ({ ...prev, currentDateId: dateIdToUse || null }));
             }
           } catch (e) {
             console.warn("Could not fetch available dates", e);
           }
        }

        if (!dateIdToUse) {
          try {
            const range = await getCollectionRange(currentConfig.collection);
            if (range.last) {
              dateIdToUse = range.last;
              setAppState(prev => ({ ...prev, currentDateId: dateIdToUse || null }));
            }
          } catch (e) {
            console.warn("Could not fetch collection range", e);
          }
        }
      }

      const data = await generateSatelliteImage({
        collection: currentConfig.collection,
        band: currentConfig.band,
        bbox: currentBbox,
        width: reqWidth,
        height: reqHeight,
        colorMap: {
          min: currentConfig.minInfo,
          max: currentConfig.maxInfo,
          colors: currentConfig.colorPalette,
        },
      }, dateIdToUse || undefined);

      setGeneratedData(data);
    } catch (err: any) {
      setError(err.message || "Unknown error occurred");
      setGeneratedData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleManualGenerate = () => {
    fetchSatelliteData(appState.bbox, appState, appState.currentDateId);
  };

  const handleSelectionComplete = (newBbox: [number, number, number, number]) => {
    setIsSelectionMode(false);
    setGeneratedData(null);
    setAppState(prev => ({ ...prev, bbox: newBbox }));
    // Explicitly call fetch to respond immediately, relying on internal setGeneratedData(null)
    fetchSatelliteData(newBbox, appState, appState.currentDateId);
  };

  const handlePrevDate = async () => {
    if (!appState.currentDateId || availableDates.length === 0) return;
    const currentIndex = availableDates.indexOf(appState.currentDateId);
    if (currentIndex > 0) {
      const prevId = availableDates[currentIndex - 1];
      setAppState(prev => ({ ...prev, currentDateId: prevId }));
      fetchSatelliteData(appState.bbox, appState, prevId);
    } else {
      const prevId = await getNeighborDate(appState.collection, appState.currentDateId, 'prev');
      if (prevId) {
        setAppState(prev => ({ ...prev, currentDateId: prevId }));
        fetchSatelliteData(appState.bbox, appState, prevId);
      }
    }
  };

  const handleNextDate = async () => {
    if (!appState.currentDateId || availableDates.length === 0) return;
    const currentIndex = availableDates.indexOf(appState.currentDateId);
    if (currentIndex >= 0 && currentIndex < availableDates.length - 1) {
      const nextId = availableDates[currentIndex + 1];
      setAppState(prev => ({ ...prev, currentDateId: nextId }));
      fetchSatelliteData(appState.bbox, appState, nextId);
    } else {
      const nextId = await getNeighborDate(appState.collection, appState.currentDateId, 'next');
      if (nextId) {
        setAppState(prev => ({ ...prev, currentDateId: nextId }));
        fetchSatelliteData(appState.bbox, appState, nextId);
      }
    }
  };

  const handleLatestDate = () => {
    if (availableDates.length > 0) {
      const last = availableDates[availableDates.length - 1];
      setAppState(prev => ({ ...prev, currentDateId: last }));
      fetchSatelliteData(appState.bbox, appState, last);
    } else {
      handleManualGenerate(); // fallback
    }
  };

  const handleSelectDateFromList = (dateId: string) => {
    setAppState(prev => ({ ...prev, currentDateId: dateId }));
    fetchSatelliteData(appState.bbox, appState, dateId);
    setShowDateList(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
       fetchSatelliteData(appState.bbox, appState);
    }, 1000); 
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  useEffect(() => {
    const timer = setTimeout(() => {
       fetchSatelliteData(appState.bbox, appState, appState.currentDateId);
    }, 500);
    return () => clearTimeout(timer);
  }, [appState.bbox, appState.colorPalette, appState.minInfo, appState.maxInfo, appState.collection]); 

  return (
    <div className="relative w-screen h-screen bg-black font-sans text-slate-100 overflow-hidden selection:bg-white/20">
      
      {/* Full Screen Map Background */}
      <div className="absolute inset-0 z-0">
        <ImageViewer 
          data={generatedData}
          isLoading={loading} 
          error={error} 
          bbox={appState.bbox}
          opacity={appState.opacity}
          language={appState.language}
          isSelectionMode={isSelectionMode}
          onSelectionComplete={handleSelectionComplete}
        />
      </div>

      {/* Floating Control Panel (Glassmorphism Sidebar) */}
      <div className="absolute top-4 left-4 z-[2000] h-[calc(100vh-2rem)] w-[340px] flex flex-col pointer-events-none">
        <ControlPanel 
          state={appState} 
          isGenerating={loading}
          availableDates={availableDates}
          isSelectionMode={isSelectionMode}
          onUpdateState={handleUpdateState}
          onGenerate={handleManualGenerate}
          onToggleLanguage={toggleLanguage}
          onPrevDate={handlePrevDate}
          onNextDate={handleNextDate}
          onLatestDate={handleLatestDate}
          onToggleDateList={() => setShowDateList(true)}
          onToggleSelectionMode={() => setIsSelectionMode(!isSelectionMode)}
        />
      </div>

      {/* Date Modal - Monochrome */}
      {showDateList && (
        <div className="absolute inset-0 z-[3000] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#1c1c1e]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm h-[70%] flex flex-col overflow-hidden ring-1 ring-white/10">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h3 className="font-semibold text-sm text-white">Select Date</h3>
              <button 
                onClick={() => setShowDateList(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4 text-zinc-300" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
              {availableDates.length > 0 ? (
                <div className="grid grid-cols-1 gap-1">
                  {availableDates.map((date) => (
                    <button
                      key={date}
                      onClick={() => handleSelectDateFromList(date)}
                      className={`px-4 py-2.5 text-left font-mono text-xs rounded-lg transition-all ${
                        appState.currentDateId === date 
                          ? 'bg-white text-black shadow-lg font-bold' 
                          : 'hover:bg-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {date}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-zinc-500 text-sm">
                   {loading ? "Loading dates..." : "No dates found."}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
