
import React, { useState } from 'react';
import { 
  Map as MapIcon, Mountain, MousePointerClick, 
  Satellite, ChevronDown, Clock, ChevronLeft, ChevronRight, RefreshCw, Settings,
  Crop, XCircle
} from 'lucide-react';
import { COLOR_PALETTES, PRESET_LOCATIONS, DATASETS } from '../constants';
import { AppState } from '../types';
import { getTranslation } from '../translations';

interface ControlPanelProps {
  state: AppState;
  isGenerating: boolean;
  availableDates: string[];
  isSelectionMode: boolean; // New prop
  onUpdateState: (newState: Partial<AppState>) => void;
  onGenerate: () => void;
  onToggleLanguage: () => void;
  onPrevDate: () => void;
  onNextDate: () => void;
  onLatestDate: () => void;
  onToggleDateList: () => void;
  onToggleSelectionMode: () => void; // New prop
}

const SectionHeader: React.FC<{ 
  label: string; 
  icon: React.ElementType; 
  isOpen?: boolean; 
  onClick?: () => void 
}> = ({ label, icon: Icon, isOpen = true, onClick }) => (
  <div 
    className="flex items-center justify-between py-3 px-2 cursor-pointer text-zinc-400 hover:text-white transition-colors select-none group rounded-lg hover:bg-white/5 mt-1"
    onClick={onClick}
  >
    <div className="flex items-center gap-2.5">
      <div className={`p-1 rounded-md transition-colors ${isOpen ? 'bg-white text-black' : 'bg-white/5 text-zinc-500 group-hover:text-zinc-300'}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <span className="text-[11px] font-semibold uppercase tracking-widest">{label}</span>
    </div>
    {onClick && (
      <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
         <ChevronDown className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400" />
      </div>
    )}
  </div>
);

export const ControlPanel: React.FC<ControlPanelProps> = ({
  state,
  isGenerating,
  availableDates,
  isSelectionMode,
  onUpdateState,
  onGenerate,
  onToggleLanguage,
  onPrevDate,
  onNextDate,
  onLatestDate,
  onToggleDateList,
  onToggleSelectionMode
}) => {
  const t = getTranslation(state.language);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    time: true,
    location: true,
    visualization: true,
    range: true,
  });

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };
  
  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = PRESET_LOCATIONS.find(p => p.id === e.target.value);
    if (selected) {
      onUpdateState({ bbox: selected.bbox });
    }
  };

  const currentDatasetConfig = DATASETS.find(d => d.collection === state.collection) || DATASETS[0];
  const currentPresetId = PRESET_LOCATIONS.find(
    p => JSON.stringify(p.bbox) === JSON.stringify(state.bbox)
  )?.id || "custom";

  // Date Logic
  const currentIndex = state.currentDateId ? availableDates.indexOf(state.currentDateId) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex !== -1 && currentIndex < availableDates.length - 1;
  const showTimeControls = currentDatasetConfig.hasTimeDimension;

  return (
    <div className="w-full h-full flex flex-col bg-[#000000]/60 backdrop-blur-2xl rounded-[24px] border border-white/10 shadow-2xl overflow-hidden ring-1 ring-white/5 pointer-events-auto transition-all duration-300">
      
      <style>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        /* Hide scrollbar for IE, Edge and Firefox */
        .no-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>

      {/* Header */}
      <div className="h-16 px-5 flex items-center justify-between bg-white/5 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
           <div className="w-9 h-9 bg-white rounded-xl shadow-lg flex items-center justify-center">
             <Satellite className="w-5 h-5 text-black" />
           </div>
           <div>
             <h1 className="font-bold text-sm text-white tracking-tight">JAXA Earth</h1>
             <p className="text-[10px] text-zinc-400 font-medium tracking-wide">OBSERVER</p>
           </div>
        </div>
        <button 
          onClick={onToggleLanguage}
          className="text-[10px] font-bold text-zinc-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-full border border-white/5"
        >
          {state.language === 'en' ? 'JP' : 'EN'}
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 py-2 no-scrollbar space-y-1">
        
        {/* Dataset Selection (Always visible) */}
        <div className="pt-4 pb-2 px-2">
            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-2">{t.dataset}</label>
            <div className="relative group">
                <select
                    value={state.collection}
                    onChange={(e) => onUpdateState({ collection: e.target.value })}
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:ring-2 focus:ring-white/30 transition-all appearance-none cursor-pointer font-medium"
                >
                    {DATASETS.map((d) => (
                    <option key={d.id} value={d.collection} className="bg-zinc-900 text-zinc-200">
                        {d.name[state.language]}
                    </option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none group-hover:text-zinc-300 transition-colors" />
            </div>
        </div>

        {/* Time Series Section */}
        {showTimeControls && (
          <div className="mb-2">
            <SectionHeader 
              label="Timeline" 
              icon={Clock} 
              isOpen={expandedSections.time}
              onClick={() => toggleSection('time')}
            />
            
            {expandedSections.time && (
              <div className="px-2 pt-1 pb-2 space-y-2 animate-in slide-in-from-top-1 duration-200 fade-in">
                <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1 border border-white/5">
                  <button 
                    onClick={onPrevDate}
                    disabled={isGenerating || !hasPrev}
                    className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all active:scale-95"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <div 
                    onClick={onToggleDateList}
                    className="flex-1 flex flex-col items-center justify-center cursor-pointer group py-1"
                  >
                    <span className="text-[13px] font-mono font-medium text-white group-hover:text-white transition-colors">
                      {state.currentDateId || "----"}
                    </span>
                  </div>

                  <button 
                    onClick={onNextDate}
                    disabled={isGenerating || !hasNext}
                    className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all active:scale-95"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex justify-end">
                  <button 
                    onClick={onLatestDate}
                    disabled={isGenerating}
                    className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors disabled:opacity-30 px-2 py-1 hover:bg-white/10 rounded-md"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Latest
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Location Section */}
        <div className="mb-2">
          <SectionHeader 
            label={t.locationPresets} 
            icon={MapIcon} 
            isOpen={expandedSections.location}
            onClick={() => toggleSection('location')}
          />
          
          {expandedSections.location && (
            <div className="px-2 pt-1 pb-2 space-y-3 animate-in slide-in-from-top-1 duration-200 fade-in">
              <div className="relative group">
                <select
                  value={currentPresetId}
                  onChange={handlePresetChange}
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:ring-2 focus:ring-white/30 transition-all appearance-none cursor-pointer"
                >
                  <option value="custom" disabled className="bg-zinc-900">{t.customSelection}</option>
                  {PRESET_LOCATIONS.map((loc) => (
                    <option key={loc.id} value={loc.id} className="bg-zinc-900">
                      {loc.name[state.language]}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none group-hover:text-zinc-300" />
              </div>

              {/* Range Selection Toggle */}
              <div>
                {!isSelectionMode ? (
                  <button
                    onClick={onToggleSelectionMode}
                    className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-300 hover:text-white py-2.5 rounded-xl text-xs font-medium transition-all active:scale-[0.98]"
                  >
                    <Crop className="w-3.5 h-3.5" />
                    <span>{t.selectArea}</span>
                  </button>
                ) : (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center animate-pulse-border">
                    <p className="text-[10px] text-zinc-300 font-medium mb-2 tracking-wide">{t.dragToSelect}</p>
                    <button
                      onClick={onToggleSelectionMode}
                      className="w-full flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 py-1.5 rounded-lg text-[10px] transition-all"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>{t.cancelSelection}</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center px-1 border-t border-white/5 pt-2 mt-2">
                 <div className="text-[9px] text-zinc-500 font-mono flex gap-3">
                   <span>LAT <span className="text-zinc-300">{state.bbox[1].toFixed(2)}</span></span>
                   <span>LON <span className="text-zinc-300">{state.bbox[0].toFixed(2)}</span></span>
                 </div>
              </div>
            </div>
          )}
        </div>

        {/* Visualization Parameters */}
        <div className="mb-2">
          <SectionHeader 
            label={t.visualization} 
            icon={Settings} 
            isOpen={expandedSections.visualization}
            onClick={() => toggleSection('visualization')}
          />

          {expandedSections.visualization && (
            <div className="px-2 pt-1 pb-2 space-y-4 animate-in slide-in-from-top-1 duration-200 fade-in">
               {/* Palette */}
               <div>
                  <label className="text-[10px] text-zinc-500 font-bold mb-2 block">{t.colorPalette}</label>
                  <div className="relative group">
                    <select
                      value={state.colorPalette}
                      onChange={(e) => onUpdateState({ colorPalette: e.target.value })}
                      className="w-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:ring-2 focus:ring-white/30 transition-all appearance-none cursor-pointer"
                    >
                      {COLOR_PALETTES.map((p) => (
                        <option key={p.value} value={p.value} className="bg-zinc-900">{p.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none group-hover:text-zinc-300" />
                  </div>
               </div>

               {/* Opacity */}
               <div>
                  <div className="flex justify-between items-center mb-2">
                     <label className="text-[10px] text-zinc-500 font-bold">{t.overlayOpacity}</label>
                     <span className="text-[10px] font-mono text-white bg-white/10 px-1.5 py-0.5 rounded">{Math.round(state.opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={state.opacity}
                    onChange={(e) => onUpdateState({ opacity: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-white"
                  />
               </div>
            </div>
          )}
        </div>

        {/* Data Range */}
        <div className="mb-2">
          <SectionHeader 
            label={t.elevationRange} 
            icon={Mountain} 
            isOpen={expandedSections.range}
            onClick={() => toggleSection('range')}
          />
          
          {expandedSections.range && (
            <div className="px-2 pt-1 pb-2 space-y-3 animate-in slide-in-from-top-1 duration-200 fade-in">
               <div className="bg-white/5 border border-white/5 rounded-xl p-3 space-y-4">
                 <div>
                   <div className="flex justify-between text-[10px] text-zinc-500 mb-1.5">
                      <span className="font-semibold">Min ({currentDatasetConfig.unit})</span>
                      <span className="text-white font-mono">{state.minInfo}</span>
                   </div>
                   <input
                     type="range"
                     min={currentDatasetConfig.min * 1.5}
                     max={currentDatasetConfig.max}
                     step={currentDatasetConfig.step}
                     value={state.minInfo}
                     onChange={(e) => {
                       const val = parseFloat(e.target.value);
                       if (val < state.maxInfo) onUpdateState({ minInfo: val });
                     }}
                     className="w-full h-1.5 bg-zinc-700/50 rounded-full appearance-none cursor-pointer accent-white"
                   />
                 </div>

                 <div>
                   <div className="flex justify-between text-[10px] text-zinc-500 mb-1.5">
                      <span className="font-semibold">Max ({currentDatasetConfig.unit})</span>
                      <span className="text-white font-mono">{state.maxInfo}</span>
                   </div>
                   <input
                     type="range"
                     min={currentDatasetConfig.min}
                     max={currentDatasetConfig.max * 1.5}
                     step={currentDatasetConfig.step}
                     value={state.maxInfo}
                     onChange={(e) => {
                       const val = parseFloat(e.target.value);
                       if (val > state.minInfo) onUpdateState({ maxInfo: val });
                     }}
                     className="w-full h-1.5 bg-zinc-700/50 rounded-full appearance-none cursor-pointer accent-white"
                   />
                 </div>
               </div>
            </div>
          )}
        </div>

      </div>

      {/* Footer / Action */}
      <div className="p-4 border-t border-white/5 bg-white/[0.02] shrink-0">
        <button
          onClick={onGenerate}
          disabled={isGenerating || isSelectionMode}
          className={`w-full py-3.5 px-4 rounded-xl font-semibold text-xs shadow-lg transition-all flex items-center justify-center gap-2
            ${(isGenerating || isSelectionMode)
              ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed border border-zinc-800' 
              : 'bg-white hover:bg-zinc-200 text-black hover:shadow-white/10 active:scale-[0.98]'
            }`}
        >
          {isGenerating ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-zinc-300 border-t-black rounded-full animate-spin" />
              <span className="tracking-wide">PROCESSING</span>
            </>
          ) : (
            <>
              <MousePointerClick className="w-4 h-4" />
              <span className="tracking-wide">{t.generateMap}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
