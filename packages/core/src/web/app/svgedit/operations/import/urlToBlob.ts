/**
 * Fetch an image from a URL and convert it to a Blob
 * @param url - The URL of the image to fetch
 * @returns Promise that resolves to a Blob
 * @throws Error if the fetch fails or the response is not ok
 */
const urlToBlob = async (url: string): Promise<Blob> => {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();

    // Validate that we got an image blob
    if (!blob.type.startsWith('image/')) {
      throw new Error(`Invalid content type: ${blob.type}. Expected an image.`);
    }

    return blob;
  } catch (error) {
    if (error instanceof Error) {
      throw new TypeError(`Failed to convert URL to Blob: ${error.message}`);
    }

    throw new Error('Failed to convert URL to Blob: Unknown error');
  }
};

export default urlToBlob;
