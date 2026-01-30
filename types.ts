
export interface JaxaImageParams {
  collection: string;
  band: string;
  bbox: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
  width: number;
  height: number;
  colorMap: {
    min: number;
    max: number;
    colors: string;
  };
  date?: Date; // Optional date for time-series
}

export interface JaxaImageObject {
  getCanvas: () => HTMLCanvasElement;
  getLegend: (width: number, height: number, fontSize: number) => HTMLCanvasElement;
  getFormattedDate: () => string;
  getDate: () => Date;
  getValue: (i: number, j: number) => number | null;
  getCoordinates: (i: number, j: number) => [number, number];
}

export interface JaxaImageCollection {
  init: () => Promise<void>;
  first: () => Promise<string>;
  last: () => Promise<string>;
  firstDate: () => Promise<Date>;
  lastDate: () => Promise<Date>;
  prev: (currentId: string) => Promise<string | null>;
  next: (currentId: string) => Promise<string | null>;
  getTemporalIdAll: (start: Date, end: Date) => Promise<string[]>;
  parseDate: (dateId: string) => Date;
  getImage: (params: { date: Date; band: string; bilinearResampling?: boolean }) => Promise<JaxaImageObject>;
}

// Minimal definition for the global 'je' object provided by the UMD script
export interface JaxaEarthGlobal {
  getImage: (params: JaxaImageParams) => Promise<JaxaImageObject>;
  ImageCollection: new (params: { collection: string }) => JaxaImageCollection;
}

declare global {
  interface Window {
    je?: JaxaEarthGlobal;
    L: any; // Leaflet global
  }
}

export interface PresetLocation {
  id: string;
  name: {
    en: string;
    ja: string;
  };
  bbox: [number, number, number, number];
  description: {
    en: string;
    ja: string;
  };
}

export interface DatasetConfig {
  id: string;
  name: {
    en: string;
    ja: string;
  };
  collection: string;
  band: string;
  min: number;
  max: number;
  step: number;
  defaultPalette: string;
  unit: string;
  hasTimeDimension: boolean;
}

export type Language = 'ja' | 'en';

export interface AppState {
  collection: string;
  band: string;
  bbox: [number, number, number, number];
  minInfo: number;
  maxInfo: number;
  colorPalette: string;
  opacity: number;
  language: Language;
  currentDateId: string | null; // e.g., "2021-06"
}

export interface InspectionData {
  lat: number;
  lon: number;
  value: number | null;
  x: number;
  y: number;
}
