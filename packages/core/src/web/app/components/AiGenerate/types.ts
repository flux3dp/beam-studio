// Aspect ratios now include both landscape and portrait variants directly
export type AspectRatio = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '9:16' | '16:9' | '21:9';
export type ImageSize = '1K' | '2K' | '4K';
export type GenerationStatus = 'failed' | 'generating' | 'idle' | 'success';
export type GenerationMode = 'edit' | 'text-to-image';

export type ImageDimensions = { aspectRatio: AspectRatio; size: ImageSize };
/** Represents a single image input - either a local file upload or url */
export type ImageInput = { file: File; id: string; type: 'file' } | { id: string; type: 'url'; url: string };
