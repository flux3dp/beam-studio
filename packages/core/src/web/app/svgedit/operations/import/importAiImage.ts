import importBitmap from './importBitmap';
import urlToBlob from './urlToBlob';

/**
 * Import an AI-generated image from a URL into the canvas
 * This function fetches the image from the URL, converts it to a Blob,
 * and then uses the existing bitmap import infrastructure to add it to the canvas.
 *
 * @param imageUrl - The URL of the AI-generated image to import
 * @returns Promise that resolves when the image is successfully imported
 * @throws Error if the import fails
 */
export const importAiImage = async (imageUrl: string): Promise<void> => {
  try {
    // Convert the image URL to a Blob
    const blob = await urlToBlob(imageUrl);

    // Extract filename from URL for better File object naming
    const filename = imageUrl.split('/').pop() || 'ai-generated-image.png';

    // Create a File object from the Blob (maintains compatibility with existing import logic)
    const file = new File([blob], filename, { type: blob.type });

    // Use the existing bitmap import function which handles:
    // - Layer module detection (printing vs. engraving)
    // - Grayscale conversion for laser cutting
    // - EXIF rotation
    // - DPI scaling
    // - Undo/redo history
    await importBitmap(file);
  } catch (error) {
    if (error instanceof Error) {
      throw new TypeError(`Failed to import AI image: ${error.message}`);
    }

    throw new Error('Failed to import AI image: Unknown error');
  }
};
