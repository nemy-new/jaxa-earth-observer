
import { PresetLocation, DatasetConfig } from "./types";

export const DATASETS: DatasetConfig[] = [
  {
    id: "aw3d30",
    name: { en: "Elevation (ALOS AW3D30)", ja: "標高 (AW3D30)" },
    collection: "https://s3.ap-northeast-1.wasabisys.com/je-pds/cog/v1/JAXA.EORC_ALOS.PRISM_AW3D30.v3.2_global/collection.json",
    band: "DSM",
    min: 0,
    max: 4000,
    step: 100,
    defaultPalette: "jet",
    unit: "m",
    hasTimeDimension: false
  },
  {
    id: "ndvi",
    name: { en: "Vegetation (GCOM-C NDVI)", ja: "植生指数 (GCOM-C NDVI)" },
    collection: "https://s3.ap-northeast-1.wasabisys.com/je-pds/cog/v1/JAXA.GCOM-C.SGLI.L2.VGI.v3/collection.json",
    band: "NDVI",
    min: -0.2,
    max: 1.0,
    step: 0.1,
    defaultPalette: "jet",
    unit: "",
    hasTimeDimension: true
  },
  {
    id: "sst",
    name: { en: "Sea Surface Temp (GCOM-C SST)", ja: "海面水温 (GCOM-C SST)" },
    collection: "https://s3.ap-northeast-1.wasabisys.com/je-pds/cog/v1/JAXA.GCOM-C.SGLI.L2.SST.v3/collection.json",
    band: "SST_Ave",
    min: 0,
    max: 35,
    step: 1,
    defaultPalette: "jet",
    unit: "°C",
    hasTimeDimension: true
  },
  {
    id: "gsmap",
    name: { en: "Rainfall (GSMaP Hourly)", ja: "降水量 (GSMaP)" },
    collection: "https://s3.ap-northeast-1.wasabisys.com/je-pds/cog/v1/JAXA.GPM.L3.GSMaP_NOW.v6/collection.json",
    band: "hourlyPrecipitationRateGC",
    min: 0,
    max: 50,
    step: 1,
    defaultPalette: "jet",
    unit: "mm/h",
    hasTimeDimension: true
  }
];

export const PRESET_LOCATIONS: PresetLocation[] = [
  {
    id: "global",
    name: { en: "Global View", ja: "全世界" },
    bbox: [-180, -90, 180, 90],
    description: { en: "Entire Earth projection", ja: "全地球投影" }
  },
  {
    id: "japan_archipelago",
    name: { en: "Japanese Archipelago", ja: "日本列島" },
    bbox: [122.0, 22.0, 150.0, 48.0],
    description: { en: "Overview of the entire Japanese archipelago", ja: "日本列島全体の概観" }
  },
  {
    id: "japan",
    name: { en: "Japan (Mt. Fuji)", ja: "日本 (富士山周辺)" },
    bbox: [138.0, 34.5, 139.5, 36.0],
    description: { en: "High relief detail of Mount Fuji", ja: "富士山とその周辺の詳細地形" }
  },
  {
    id: "himalayas",
    name: { en: "Himalayas (Everest)", ja: "ヒマラヤ (エベレスト)" },
    bbox: [86.5, 27.5, 87.5, 28.5],
    description: { en: "Mount Everest region", ja: "エベレスト山周辺の極高地" }
  },
  {
    id: "grand_canyon",
    name: { en: "Grand Canyon, USA", ja: "グランドキャニオン (米国)" },
    bbox: [-113.0, 35.8, -111.5, 36.5],
    description: { en: "Deep canyon topography", ja: "大峡谷の地形" }
  },
  {
    id: "alps",
    name: { en: "Alps (Europe)", ja: "アルプス山脈 (欧州)" },
    bbox: [6.0, 45.0, 10.0, 47.0],
    description: { en: "The European Alps mountain range", ja: "ヨーロッパアルプス山脈" }
  },
  {
    id: "kilimanjaro",
    name: { en: "Kilimanjaro (Africa)", ja: "キリマンジャロ (アフリカ)" },
    bbox: [37.0, -3.4, 37.7, -2.8],
    description: { en: "Highest mountain in Africa", ja: "アフリカ最高峰" }
  }
];

export const COLOR_PALETTES = [
  { value: "jet", label: "Jet (Rainbow/虹色)" },
  { value: "gray", label: "Grayscale (白黒)" }
];

// Initial state
export const INITIAL_WIDTH = 1000;
