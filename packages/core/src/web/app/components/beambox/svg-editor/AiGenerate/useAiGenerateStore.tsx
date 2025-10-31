import { create } from 'zustand';

import type { AiImageGenerationData } from '@core/helpers/api/ai-image';
import type { ImageResolution, ImageSizeOption } from '@core/helpers/api/ai-image';
import { getAiImageHistory } from '@core/helpers/api/ai-image';

import type { ImageInput } from './types';

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
  selectedImageInputs: ImageInput[]; // Unified ordered array
  selectedStyle: StyleType;
  showHistory: boolean;
  textToDisplay: string;
}

interface Actions {
  addImageInput: (input: ImageInput) => void;
  addPendingHistoryItem: (params: {
    count: number;
    dimensions: ImageDimensions;
    imageInputs?: ImageInput[];
    mode: GenerationMode;
    prompt: string;
    uuid: string;
  }) => void;
  clearGenerationResults: () => void;
  clearImageInputs: () => void;
  importFromHistory: (item: AiImageGenerationData) => void;
  loadHistory: () => Promise<void>;
  removeImageInput: (id: string) => void;
  resetForm: () => void;
  setMode: (mode: GenerationMode) => void;
  toggleHistory: () => void;
  updateHistoryItem: (uuid: string, updates: Partial<AiImageGenerationData>) => void;
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
  selectedImageInputs: [],
  selectedStyle: 'logo_with_text',
  showHistory: false,
  textToDisplay: '',
};

export const useAiGenerateStore = create<Actions & State>((set) => ({
  ...initialState,
  addImageInput: (input) => {
    set((state) => ({ selectedImageInputs: [...state.selectedImageInputs, input] }));
  },
  addPendingHistoryItem: (params) => {
    // Map form dimensions to API format
    const getImageSizeOption = (): ImageSizeOption => {
      const { aspectRatio, orientation } = params.dimensions;

      if (aspectRatio === '1:1') return 'square_hd';

      return `${orientation}_${aspectRatio.replace(':', '_')}` as ImageSizeOption;
    };

    const getImageResolution = (): ImageResolution => {
      const { size } = params.dimensions;

      if (size === 'large') return '4K';

      if (size === 'medium') return '2K';

      return '1K';
    };

    // Extract URLs from imageInputs for history storage
    const imageUrls = params.imageInputs
      ?.filter((input) => input.type === 'url')
      .map((input) => (input.type === 'url' ? input.url : ''))
      .filter(Boolean);

    // Create optimistic history item
    const newItem: AiImageGenerationData = {
      completed_at: null,
      cost_time: null,
      created_at: new Date().toISOString(),
      fail_msg: null,
      image_resolution: getImageResolution(),
      image_size: getImageSizeOption(),
      image_urls: imageUrls,
      max_images: params.count,
      model_type: params.mode === 'edit' ? 'edit' : 'text-to-image',
      prompt: params.prompt,
      result_urls: null,
      seed: null,
      state: 'pending',
      task_id: null,
      uuid: params.uuid,
    };

    // Prepend to history (newest first)
    set((state) => ({
      historyItems: [newItem, ...state.historyItems],
    }));
  },
  clearGenerationResults: () => {
    set({ errorMessage: null, generatedImages: [], generationStatus: 'idle', generationUuid: null });
  },
  clearImageInputs: () => {
    set({ selectedImageInputs: [] });
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

    // Convert history URLs to ImageInput format
    const imageInputs: ImageInput[] =
      mode === 'edit' && item.image_urls
        ? item.image_urls.map((url, index) => ({
            id: `history-${item.uuid}-${index}`,
            type: 'url' as const,
            url,
          }))
        : [];

    // Set state with imported data
    set({
      count: item.max_images,
      dimensions,
      generatedImages: item.result_urls || [],
      generationStatus: item.state === 'success' ? 'success' : 'idle',
      mode,
      patternDescription: item.prompt,
      selectedImageInputs: imageInputs, // Restore ordered URLs
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
  removeImageInput: (id) => {
    set((state) => ({ selectedImageInputs: state.selectedImageInputs.filter((input) => input.id !== id) }));
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
      selectedImageInputs: [],
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
  updateHistoryItem: (uuid, updates) => {
    set((state) => ({
      historyItems: state.historyItems.map((item) => (item.uuid === uuid ? { ...item, ...updates } : item)),
    }));
  },
}));
