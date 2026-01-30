
import { JaxaImageParams, JaxaImageObject } from "../types";

export interface GeneratedData {
  canvas: HTMLCanvasElement;
  legend: HTMLCanvasElement;
  imageObject: JaxaImageObject;
  dateStr: string;
}

// Helper to ensure JE is loaded
const ensureJeLoaded = async () => {
  if (!window.je) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (!window.je) {
      throw new Error("JAXA Earth API is not loaded.");
    }
  }
};

/**
 * Fetch the start and end temporal IDs for a collection
 */
export const getCollectionRange = async (collectionUrl: string) => {
  await ensureJeLoaded();
  const ic = new window.je!.ImageCollection({ collection: collectionUrl });
  
  try {
    await ic.init();
    const first = await ic.first();
    const last = await ic.last();
    return { first, last };
  } catch (error) {
    console.warn("Failed to fetch collection range (likely static dataset):", error);
    return { first: null, last: null };
  }
};

/**
 * Fetch all available temporal IDs for a collection
 */
export const getAvailableDates = async (collectionUrl: string): Promise<string[]> => {
  await ensureJeLoaded();
  const ic = new window.je!.ImageCollection({ collection: collectionUrl });
  
  try {
    await ic.init();
    
    // Attempt to get dates. This might fail if the collection JSON lacks 'summaries' (e.g. AW3D30)
    const firstDate = await ic.firstDate();
    const lastDate = await ic.lastDate();
    
    if (!firstDate || !lastDate) return [];

    // Extend end date by a bit to ensure the last ID is included
    const endBuffer = new Date(lastDate);
    endBuffer.setMonth(endBuffer.getMonth() + 1);
    
    const dates = await ic.getTemporalIdAll(firstDate, endBuffer);
    return dates || [];
  } catch (error) {
    console.warn("Failed to get available dates (likely static dataset):", error);
    return [];
  }
};

/**
 * Find the previous or next available temporal ID
 */
export const getNeighborDate = async (collectionUrl: string, currentId: string, direction: 'prev' | 'next'): Promise<string | null> => {
  await ensureJeLoaded();
  const ic = new window.je!.ImageCollection({ collection: collectionUrl });
  await ic.init();
  
  if (direction === 'prev') {
    return await ic.prev(currentId);
  } else {
    return await ic.next(currentId);
  }
};

export const generateSatelliteImage = async (params: JaxaImageParams, dateId?: string): Promise<GeneratedData> => {
  await ensureJeLoaded();

  try {
    let image: JaxaImageObject;

    // If a specific date ID is provided, use ImageCollection to fetch that specific timeframe
    if (dateId) {
      const ic = new window.je!.ImageCollection({ collection: params.collection });
      await ic.init();
      
      const targetDate = ic.parseDate(dateId);
      
      image = await ic.getImage({
        date: targetDate,
        band: params.band,
        bilinearResampling: false // default to nearest neighbor for performance
      });

      // We still need to set the bbox, output size, and colormap on the image object returned by ImageCollection
      // Note: The API requires calling these methods on the image instance when created via ImageCollection
      // However, the UMD's `je.getImage` wrapper handles this automatically. 
      // Since `ic.getImage` returns a raw Image object, we need to configure it manually similar to the wrapper.
      
      // Using 'any' cast here because the type definition for the raw Image object methods 
      // matches what we need but we need to invoke them dynamically.
      const imgAny = image as any;
      
      if (imgAny.setBbox) imgAny.setBbox(params.bbox);
      if (imgAny.setSize) imgAny.setSize(params.width, params.height);
      if (imgAny.setColorMap) imgAny.setColorMap({
        ...params.colorMap,
        deleteMin: false,
        deleteMax: false
      });
      
      await imgAny.init();

    } else {
      // Fallback to simple latest image if no date provided
      image = await window.je!.getImage(params);
    }
    
    // Generate legend
    const legend = image.getLegend(300, 40, 12);
    
    // Get formatted date
    const dateStr = image.getFormattedDate();

    return {
      canvas: image.getCanvas(),
      legend,
      imageObject: image,
      dateStr
    };
  } catch (error) {
    console.error("JAXA API Error:", error);
    throw new Error("Failed to generate image. Please check parameters or connection.");
  }
};
