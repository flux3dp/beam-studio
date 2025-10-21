import { create } from 'zustand';

import type { AiImageGenerationData } from '@core/helpers/api/ai-image';
import { getAiImageHistory } from '@core/helpers/api/ai-image';

export type AspectRatio = '1:1' | '4:3' | '16:9' | 'custom';
export type ImageSize = 'large' | 'medium' | 'small';
export type StyleType = 'illustration' | 'logo_with_text' | 'pattern';
export type Orientation = 'landscape' | 'portrait';
export type GenerationStatus = 'failed' | 'generating' | 'idle' | 'success';
export type GenerationMode = 'edit' | 'text-to-image';

export interface ImageDimensions {
  aspectRatio: AspectRatio;
  customHeight?: number;
  customWidth?: number;
  orientation: Orientation;
  size: ImageSize;
}

interface State {
  count: number;
  dimensions: ImageDimensions;
  errorMessage: null | string;
  generatedImages: string[];
  generationStatus: GenerationStatus;
  generationUuid: null | string;
  historyError: null | string;
  historyItems: AiImageGenerationData[];
  historyLoading: boolean;
  historyOffset: number;
  isAiGenerateShown: boolean;
  mode: GenerationMode;
  patternDescription: string;
  selectedImages: File[];
  selectedImageUrls: string[];
  selectedStyle: StyleType;
  showHistory: boolean;
  textToDisplay: string;
}

interface Actions {
  addSelectedImage: (file: File) => void;
  addSelectedImageUrl: (url: string) => void;
  clearGenerationResults: () => void;
  clearSelectedImages: () => void;
  importFromHistory: (item: AiImageGenerationData) => void;
  loadHistory: () => Promise<void>;
  removeSelectedImage: (index: number) => void;
  removeSelectedImageUrl: (url: string) => void;
  resetForm: () => void;
  setMode: (mode: GenerationMode) => void;
  toggleHistory: () => void;
}

const initialState: State = {
  count: 1,
  dimensions: { aspectRatio: '1:1', orientation: 'landscape', size: 'small' },
  errorMessage: null,
  generatedImages: [],
  generationStatus: 'idle',
  generationUuid: null,
  historyError: null,
  historyItems: [],
  historyLoading: false,
  historyOffset: 0,
  isAiGenerateShown: false,
  mode: 'text-to-image',
  patternDescription: '',
  selectedImages: [],
  selectedImageUrls: [],
  selectedStyle: 'logo_with_text',
  showHistory: false,
  textToDisplay: '',
};

export const useAiGenerateStore = create<Actions & State>((set) => ({
  ...initialState,
  addSelectedImage: (file) => {
    set((state) => ({ selectedImages: [...state.selectedImages, file] }));
  },
  addSelectedImageUrl: (url) => {
    set((state) => ({ selectedImageUrls: [...state.selectedImageUrls, url] }));
  },
  clearGenerationResults: () => {
    set({ errorMessage: null, generatedImages: [], generationStatus: 'idle', generationUuid: null });
  },
  clearSelectedImages: () => {
    set({ selectedImages: [], selectedImageUrls: [] });
  },
  importFromHistory: (item) => {
    // Helper to map API image size to dimensions
    const mapSizeToAspectRatio = (imageSize: string): AspectRatio => {
      if (imageSize.includes('16_9')) return '16:9';

      if (imageSize.includes('4_3')) return '4:3';

      return '1:1';
    };

    const mapSizeToOrientation = (imageSize: string): Orientation => {
      if (imageSize.startsWith('landscape')) return 'landscape';

      if (imageSize.startsWith('portrait')) return 'portrait';

      return 'landscape';
    };

    const mapResolutionToSize = (resolution: string): ImageSize => {
      if (resolution === '4K') return 'large';

      if (resolution === '2K') return 'medium';

      return 'small';
    };

    // Determine mode from model_type
    const mode: GenerationMode = item.model_type === 'text-to-image' ? 'text-to-image' : 'edit';

    // Map dimensions
    const dimensions: ImageDimensions = {
      aspectRatio: mapSizeToAspectRatio(item.image_size),
      orientation: mapSizeToOrientation(item.image_size),
      size: mapResolutionToSize(item.image_resolution),
    };

    // Set state with imported data
    set({
      count: item.max_images,
      dimensions,
      generatedImages: item.result_urls || [],
      generationStatus: item.state === 'success' ? 'success' : 'idle',
      mode,
      patternDescription: item.prompt,
      selectedImages: [], // Clear uploaded files
      selectedImageUrls: mode === 'edit' && item.image_urls ? item.image_urls : [], // Restore URLs for edit mode
      showHistory: false, // Close history panel
    });
  },
  loadHistory: async () => {
    const { historyLoading } = useAiGenerateStore.getState();

    if (historyLoading) return;

    set({ historyError: null, historyLoading: true, historyOffset: 0 });

    try {
      const result = await getAiImageHistory();

      if ('error' in result) {
        set({ historyError: result.error, historyLoading: false });

        return;
      }

      set({ historyItems: result.data, historyLoading: false, historyOffset: 20 });
    } catch (error) {
      set({
        historyError: error instanceof Error ? error.message : 'Failed to load history',
        historyLoading: false,
      });
    }
  },
  removeSelectedImage: (index) => {
    set((state) => ({ selectedImages: state.selectedImages.filter((_, i) => i !== index) }));
  },
  removeSelectedImageUrl: (url) => {
    set((state) => ({ selectedImageUrls: state.selectedImageUrls.filter((u) => u !== url) }));
  },
  resetForm: () => {
    set({
      count: initialState.count,
      dimensions: initialState.dimensions,
      errorMessage: null,
      generatedImages: [],
      generationStatus: 'idle',
      generationUuid: null,
      mode: initialState.mode,
      patternDescription: initialState.patternDescription,
      selectedImages: [],
      selectedImageUrls: [],
      selectedStyle: initialState.selectedStyle,
      textToDisplay: initialState.textToDisplay,
    });
  },
  setMode: (mode) => {
    set({ mode });
  },
  toggleHistory: () => {
    set((state) => {
      const newShowHistory = !state.showHistory;

      // Load history when opening if not loaded yet
      if (newShowHistory && !state.historyLoading) {
        useAiGenerateStore.getState().loadHistory();
      }

      return { showHistory: newShowHistory };
    });
  },
}));
