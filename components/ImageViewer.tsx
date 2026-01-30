
import React, { useEffect, useRef, useState } from 'react';
import { Download, Crop } from 'lucide-react';
import { AppState, InspectionData } from '../types';
import { getTranslation } from '../translations';
import { GeneratedData } from '../services/jaxaService';

interface ImageViewerProps {
  data: GeneratedData | null;
  isLoading: boolean;
  error: string | null;
  bbox: AppState['bbox'];
  opacity: number;
  language: AppState['language'];
  isSelectionMode: boolean; // New prop
  onSelectionComplete: (bbox: [number, number, number, number]) => void; // New prop
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ 
  data, 
  isLoading, 
  error, 
  bbox,
  opacity,
  language,
  isSelectionMode,
  onSelectionComplete
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const overlayRef = useRef<any>(null);
  const legendContainerRef = useRef<HTMLDivElement>(null);
  const selectionRectRef = useRef<any>(null);
  const startPointRef = useRef<any>(null);
  
  const [inspection, setInspection] = useState<InspectionData | null>(null);
  const t = getTranslation(language);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || !window.L) return;

    // Initialize map with EPSG:4326 (Equirectangular) projection
    const map = window.L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      crs: window.L.CRS.EPSG4326, 
      minZoom: 1,
      maxZoom: 18,
      center: [36, 138], 
      zoom: 5,
      // Disable default box zoom to avoid conflict when we implement our own drawing
      boxZoom: false
    });

    // NASA GIBS Blue Marble Next Generation
    window.L.tileLayer.wms('https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi', {
      layers: 'BlueMarble_NextGeneration',
      format: 'image/jpeg',
      version: '1.3.0',
      transparent: false,
      attribution: 'NASA GIBS'
    }).addTo(map);

    // NASA GIBS Reference Features
    window.L.tileLayer.wms('https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi', {
      layers: 'Reference_Features',
      format: 'image/png',
      version: '1.3.0',
      transparent: true
    }).addTo(map);

    // NASA GIBS Reference Labels
    window.L.tileLayer.wms('https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi', {
      layers: 'Reference_Labels',
      format: 'image/png',
      version: '1.3.0',
      transparent: true
    }).addTo(map);

    // Zoom control at bottom right, but customized via CSS
    window.L.control.zoom({ position: 'bottomright' }).addTo(map);
    
    window.L.control.attribution({ prefix: false })
      .addAttribution('&copy; JAXA Earth API &copy; NASA GIBS')
      .addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Selection Mode (Drawing)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (isSelectionMode) {
      // Enable drawing mode
      map.dragging.disable();
      mapRef.current!.style.cursor = 'crosshair';

      const onMouseDown = (e: any) => {
        // Prevent default to stop browser selection
        window.L.DomEvent.preventDefault(e);
        window.L.DomEvent.stopPropagation(e);
        
        startPointRef.current = e.latlng;
        
        // Remove old rect if exists
        if (selectionRectRef.current) {
          map.removeLayer(selectionRectRef.current);
        }

        // Create new rectangle (initially just a line/point)
        selectionRectRef.current = window.L.rectangle([e.latlng, e.latlng], {
          color: '#ffffff', // White
          weight: 2,
          dashArray: '5, 5',
          fillOpacity: 0.2
        }).addTo(map);
      };

      const onMouseMove = (e: any) => {
        if (!startPointRef.current || !selectionRectRef.current) return;
        
        // Prevent selection during drag
        window.L.DomEvent.preventDefault(e);

        // Update rectangle bounds
        const bounds = window.L.latLngBounds(startPointRef.current, e.latlng);
        selectionRectRef.current.setBounds(bounds);
      };

      const onMouseUp = (e: any) => {
        if (!startPointRef.current || !selectionRectRef.current) return;
        
        window.L.DomEvent.preventDefault(e);

        // Get final bounds
        const bounds = selectionRectRef.current.getBounds();
        const west = bounds.getWest();
        const south = bounds.getSouth();
        const east = bounds.getEast();
        const north = bounds.getNorth();

        // Clean up
        map.removeLayer(selectionRectRef.current);
        selectionRectRef.current = null;
        startPointRef.current = null;

        // Trigger callback with [minLon, minLat, maxLon, maxLat]
        // Ensure valid box
        if (west !== east && south !== north) {
           onSelectionComplete([west, south, east, north]);
        }
      };

      map.on('mousedown', onMouseDown);
      map.on('mousemove', onMouseMove);
      map.on('mouseup', onMouseUp);

      return () => {
        // Cleanup listeners
        map.off('mousedown', onMouseDown);
        map.off('mousemove', onMouseMove);
        map.off('mouseup', onMouseUp);
        
        // Re-enable map features
        map.dragging.enable();
        if (mapRef.current) {
          mapRef.current.style.cursor = '';
        }
      };
    } else {
      // Ensure cursor is reset if toggled off via prop
      if (mapRef.current) {
        mapRef.current.style.cursor = '';
      }
      map.dragging.enable();
    }
  }, [isSelectionMode, onSelectionComplete]);

  // Update Data Overlay and BBox (View Logic)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing overlay
    if (overlayRef.current) {
      map.removeLayer(overlayRef.current);
      overlayRef.current = null;
    }

    if (data?.canvas) {
      const [minLon, minLat, maxLon, maxLat] = bbox;
      const bounds = [[minLat, minLon], [maxLat, maxLon]];

      // Add new overlay
      const overlay = window.L.imageOverlay(data.canvas.toDataURL(), bounds, {
        opacity: opacity,
        interactive: true,
        className: 'satellite-overlay'
      }).addTo(map);
      
      overlayRef.current = overlay;

      // Fit bounds with some padding
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [data, bbox]); 

  // Handle Inspection Click (Interaction Logic)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    
    // Clear inspection when mode or data changes
    setInspection(null);

    const clickHandler = (e: any) => {
      if (isSelectionMode) return; // Ignore clicks during selection

      if (!data?.imageObject) {
        setInspection(null);
        return;
      }

      const { lat, lng } = e.latlng;
      const [minLon, minLat, maxLon, maxLat] = bbox;

      // Check if click is within the data bounding box
      if (lng >= minLon && lng <= maxLon && lat >= minLat && lat <= maxLat) {
        const width = data.canvas.width;
        const height = data.canvas.height;
        
        // Linear projection map for EPSG:4326
        const x = Math.floor(((lng - minLon) / (maxLon - minLon)) * width);
        const y = Math.floor(((maxLat - lat) / (maxLat - minLat)) * height);

        const value = data.imageObject.getValue(x, y);
        
        setInspection({
          lat,
          lon: lng,
          value: value ?? null,
          x: e.containerPoint.x,
          y: e.containerPoint.y
        });
      } else {
        setInspection(null);
      }
    };

    map.off('click');
    map.on('click', clickHandler);

    return () => {
      map.off('click', clickHandler);
    };
  }, [data, bbox, isSelectionMode]);

  // Update Opacity
  useEffect(() => {
    if (overlayRef.current) {
      overlayRef.current.setOpacity(opacity);
    }
  }, [opacity]);

  // Render Legend
  useEffect(() => {
    if (legendContainerRef.current && data?.legend) {
      legendContainerRef.current.innerHTML = '';
      data.legend.style.width = '100%';
      data.legend.style.height = '8px'; // Thinner, sleeker legend
      data.legend.style.borderRadius = '4px';
      legendContainerRef.current.appendChild(data.legend);
    }
  }, [data?.legend]);

  const handleDownload = () => {
    if (data?.canvas) {
      const link = document.createElement('a');
      link.download = 'jaxa-earth-analysis.png';
      link.href = data.canvas.toDataURL();
      link.click();
    }
  };

  return (
    <div className="w-full h-full relative bg-[#050505] select-none">
      <div ref={mapRef} className="w-full h-full z-0 outline-none" />

      {/* Loading State - Top thin line */}
      {isLoading && (
        <div className="absolute top-0 left-0 w-full h-[2px] z-[1100]">
           <div className="h-full bg-white shadow-[0_0_10px_#ffffff] animate-subtle-progress"></div>
        </div>
      )}

      {/* Selection Mode Indicator (Dynamic Island style) */}
      {isSelectionMode && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[2000] pointer-events-none">
          <div className="flex items-center gap-3 px-5 py-2.5 bg-black/80 backdrop-blur-xl text-white rounded-full shadow-2xl border border-white/10 ring-1 ring-white/5">
            <Crop className="w-4 h-4 animate-pulse text-white" />
            <span className="text-xs font-semibold tracking-wide">{t.drawingMode}</span>
          </div>
        </div>
      )}

      {/* Error Message (Toast style) */}
      {error && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[2000] pointer-events-none">
          <div className="px-5 py-3 bg-zinc-900/90 backdrop-blur-xl text-zinc-200 text-xs font-medium border border-zinc-700 rounded-2xl shadow-xl pointer-events-auto flex items-center gap-3">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_8px_#ffffff]"></span>
            {error}
          </div>
        </div>
      )}

      {/* Inspection Popup (iOS Popover style) */}
      {inspection && (
         <div 
           className="absolute z-[1200] pointer-events-none transition-all duration-200 ease-out"
           style={{ 
             left: inspection.x, 
             top: inspection.y,
             transform: 'translate(-50%, -100%) translateY(-24px)' 
           }}
         >
            <div className="bg-white/90 backdrop-blur-md text-zinc-900 p-3 rounded-2xl shadow-2xl border border-white/40 min-w-[140px] text-center">
               <div className="text-[10px] text-zinc-500 font-bold tracking-wider mb-1 uppercase opacity-70">
                 Value
               </div>
               <div className="font-bold text-2xl leading-none mb-2 tracking-tight text-black">
                 {inspection.value !== null 
                    ? inspection.value.toLocaleString(undefined, { maximumFractionDigits: 1 }) 
                    : 'N/A'}
               </div>
               <div className="text-[9px] text-zinc-500 font-mono bg-zinc-100 rounded-md py-1 px-2 inline-block">
                 {inspection.lat.toFixed(3)}, {inspection.lon.toFixed(3)}
               </div>
               
               {/* Arrow */}
               <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white/90 filter drop-shadow-sm"></div>
            </div>
         </div>
      )}

      {/* Data HUD (Bottom Right) - Glassmorphism */}
      {data && !isLoading && (
        <div className="absolute bottom-6 right-16 z-[1000] flex flex-col gap-3 pointer-events-none items-end">
          
          <div className="bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl p-4 pointer-events-auto min-w-[240px] text-zinc-200 rounded-2xl ring-1 ring-white/5">
             <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-3">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Acquisition Date</span>
                <span className="text-xs font-mono font-bold text-white">{data.dateStr || 'N/A'}</span>
             </div>

             <div className="space-y-1.5">
               <div ref={legendContainerRef} className="w-full opacity-90 rounded overflow-hidden"></div>
               <div className="flex justify-between text-[9px] text-zinc-500 font-medium tracking-wide pt-1">
                 <span>LOW</span>
                 <span>HIGH</span>
               </div>
             </div>
          </div>

          <button 
            onClick={handleDownload}
            className="w-10 h-10 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full shadow-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-black/80 transition-all pointer-events-auto ring-1 ring-white/5 hover:scale-105 active:scale-95"
            title={t.downloadImage}
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Minimal Attribution */}
      <div className="absolute bottom-1 right-2 z-[900] text-[9px] text-zinc-500/50 pointer-events-none font-sans font-medium mix-blend-difference">
        JAXA Earth API • NASA GIBS
      </div>

      <style>{`
        @keyframes subtle-progress {
          0% { width: 0%; opacity: 0.5; }
          50% { width: 60%; opacity: 1; }
          100% { width: 100%; opacity: 0; }
        }
        .animate-subtle-progress {
          animation: subtle-progress 2.5s infinite ease-in-out;
        }
        
        /* Customize Leaflet Zoom Controls to match Apple aesthetic */
        .leaflet-control-zoom {
          border: none !important;
          margin-bottom: 24px !important;
          margin-right: 16px !important;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .leaflet-bar {
          box-shadow: none !important;
        }
        .leaflet-control-zoom-in, .leaflet-control-zoom-out {
          background-color: rgba(0, 0, 0, 0.6) !important;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          color: #a1a1aa !important; /* zinc-400 */
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          width: 32px !important;
          height: 32px !important;
          line-height: 32px !important;
          border-radius: 9999px !important; /* Circle */
          display: flex !important;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .leaflet-control-zoom-in:hover, .leaflet-control-zoom-out:hover {
          background-color: rgba(0, 0, 0, 0.8) !important;
          color: white !important;
          transform: scale(1.1);
        }
        .leaflet-control-zoom-in {
            margin-bottom: 0 !important;
        }
        
        .leaflet-attribution-flag {
            display: none !important;
        }
        .leaflet-control-attribution {
            display: none !important; /* Hiding default attribution to use custom minimal one */
        }
        
        /* Selection fixes */
        .leaflet-container {
            user-select: none !important;
            -webkit-user-select: none !important;
            background: #000 !important;
        }
        .leaflet-image-layer, img.leaflet-image-layer {
          user-select: none !important;
          -webkit-user-select: none !important;
          -webkit-user-drag: none !important;
          pointer-events: auto;
        }
      `}</style>
    </div>
  );
};
