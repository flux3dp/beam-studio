import { match, P } from 'ts-pattern';

/**
 * Helper function to download a file from a URL.
 */
export const handleDownload = async (imageUrl: string) => {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    const extension = match([blob.type, imageUrl])
      .with(['image/png', P._], () => 'png')
      .with(['image/jpeg', P._], () => 'jpg')
      .with(['image/webp', P._], () => 'webp')
      .with(['image/avif', P._], () => 'avif')
      // Handle specific case where MIME might be application/octet-stream
      .with([P._, P.when((url) => url.toLowerCase().endsWith('.jpg'))], () => 'jpg')
      .otherwise(() => 'png');

    link.href = url;
    link.download = `ai-generated-${Date.now()}.${extension}`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download image:', error);
  }
};
