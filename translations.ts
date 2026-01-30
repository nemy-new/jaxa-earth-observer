
import { Language } from "./types";

export const translations = {
  en: {
    title: "JAXA Earth Observer",
    poweredBy: "Powered by JAXA Earth API",
    datasetLabel: "Select Dataset",
    dataset: "Dataset",
    config: "Configuration",
    locationPresets: "Location Presets",
    customSelection: "Custom Selection",
    currentBBox: "Current BBox",
    visualization: "Visualization",
    colorPalette: "Color Palette",
    overlayOpacity: "Overlay Opacity",
    elevationRange: "Data Range",
    generateMap: "Generate Map",
    processing: "Processing...",
    fetching: "Fetching Satellite Data...",
    ready: "Ready to Visualize",
    selectPrompt: "Select a location and click 'Generate Map'",
    downloadImage: "Download Layer",
    error: "Error Loading Data",
    mapInteractive: "Map Interactive • Click 'Generate Map' to overlay data",
    min: "Min",
    max: "Max",
    selectArea: "Select Area",
    drawingMode: "Drawing Mode",
    dragToSelect: "Drag on map to select area",
    cancelSelection: "Cancel"
  },
  ja: {
    title: "JAXA Earth Observer",
    poweredBy: "Powered by JAXA Earth API",
    datasetLabel: "データセット選択",
    dataset: "データセット",
    config: "設定",
    locationPresets: "場所のプリセット",
    customSelection: "カスタム選択",
    currentBBox: "現在の範囲 (BBox)",
    visualization: "表示設定",
    colorPalette: "カラーパレット",
    overlayOpacity: "重ね合わせの透明度",
    elevationRange: "データ範囲 (値)",
    generateMap: "地図を生成",
    processing: "処理中...",
    fetching: "衛星データを取得中...",
    ready: "表示準備完了",
    selectPrompt: "場所を選択して「地図を生成」をクリックしてください",
    downloadImage: "画像をダウンロード",
    error: "データ読み込みエラー",
    mapInteractive: "地図操作可能 • 「地図を生成」でデータを重ね合わせ",
    min: "最小",
    max: "最大",
    selectArea: "範囲選択",
    drawingMode: "範囲指定モード",
    dragToSelect: "地図上をドラッグして範囲を指定",
    cancelSelection: "キャンセル"
  }
};

export const getTranslation = (lang: Language) => translations[lang];
