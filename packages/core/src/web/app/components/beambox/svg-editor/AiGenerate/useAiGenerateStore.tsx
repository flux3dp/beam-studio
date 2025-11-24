import { create } from 'zustand';

import type { AiImageGenerationData } from '@core/helpers/api/ai-image';
import { getAiImageHistory } from '@core/helpers/api/ai-image';

import type { GenerationStatus, ImageDimensions, ImageInput } from './types';
import { objectToCamelCase } from './utils/caseConversion';
import { getStyleConfig } from './utils/categories';
import {
  getAspectRatioFromImageSize,
  getImageResolution,
  getImageSizeOption,
  getOrientationFromImageSize,
  getSizeFromImageResolution,
} from './utils/dimensions';
import type { StylePresetKey } from './utils/stylePresets';
import { getStylePreset } from './utils/stylePresets';

interface State {
  count: number;
  dimensions: ImageDimensions;
  // Generation State
  errorMessage: null | string;
  generatedImages: string[];
  generationStatus: GenerationStatus;
  generationUuid: null | string;
  // History State
  historyError: null | string;
  historyItems: AiImageGenerationData[];
  historyLoading: boolean;
  historyOffset: number;
  imageInputs: ImageInput[]; // Unified ordered array
  inputFields: Record<string, string>; // Dynamic input field values
  isAiGenerateShown: boolean;
  isFixedSeed: boolean; // Fixed seed mode toggle
  isLaserFriendly: boolean; // Laser-friendly mode toggle
  seed?: number; // Seed value for generation
  showHistory: boolean;
  style: StylePresetKey;
}

interface Actions {
  addImageInput: (input: ImageInput) => void;
  addPendingHistoryItem: (params: {
    count: number;
    dimensions: ImageDimensions;
    imageInputs: ImageInput[];
    uuid: string;
  }) => void;
  clearGenerationResults: () => void;
  clearImageInputs: () => void;
  importFromHistory: (item: AiImageGenerationData) => void;
  loadHistory: () => Promise<void>;
  removeImageInput: (id: string) => void;
  resetForm: () => void;
  setInputField: (key: string, value: string) => void;
  setState: (state: Partial<State>) => void;
  setStyle: (style: StylePresetKey) => void;
  toggleFixedSeed: () => void;
  toggleHistory: () => void;
  toggleLaserFriendly: () => void;
  updateHistoryItem: (uuid: string, updates: Partial<AiImageGenerationData>) => void;
}

const formInitialState = {
  count: 1,
  dimensions: { aspectRatio: '1:1', orientation: 'landscape', size: 'small' } as ImageDimensions,
  errorMessage: null,
  generatedImages: [],
  generationStatus: 'idle' as GenerationStatus,
  generationUuid: null,
  imageInputs: [],
  inputFields: {},
  isFixedSeed: false,
  isLaserFriendly: false,
  seed: undefined,
};

const initialState: State = {
  ...formInitialState,
  historyError: null,
  historyItems: [],
  historyLoading: false,
  historyOffset: 0,
  isAiGenerateShown: false,
  isFixedSeed: false,
  seed: undefined,
  showHistory: false,
  style: 'plain' as StylePresetKey,
};

export const useAiGenerateStore = create<Actions & State>((set, get) => ({
  ...initialState,
  addImageInput: (input) => {
    set((state) => ({ imageInputs: [...state.imageInputs, input] }));
  },
  addPendingHistoryItem: (params) => {
    set((state) => {
      const imageUrls = params.imageInputs.map((input) => (input.type === 'url' ? input.url : '')).filter(Boolean);

      const newItem: AiImageGenerationData = {
        completed_at: null,
        cost_time: null,
        created_at: new Date().toISOString(),
        fail_msg: null,
        image_resolution: getImageResolution(params.dimensions),
        image_size: getImageSizeOption(params.dimensions),
        image_urls: imageUrls,
        max_images: params.count,
        prompt_data: {
          inputs: state.inputFields, // Get from state
          style: state.style, // Get from state
        },
        result_urls: null,
        seed: null,
        state: 'pending',
        task_id: null,
        uuid: params.uuid,
      };

      return { historyItems: [newItem, ...state.historyItems] };
    });
  },
  clearGenerationResults: () => {
    set({ errorMessage: null, generatedImages: [], generationStatus: 'idle', generationUuid: null });
  },
  clearImageInputs: () => {
    set({ imageInputs: [] });
  },
  importFromHistory: (item) => {
    const dimensions: ImageDimensions = {
      aspectRatio: getAspectRatioFromImageSize(item.image_size),
      orientation: getOrientationFromImageSize(item.image_size),
      size: getSizeFromImageResolution(item.image_resolution),
    };

    const imageInputs: ImageInput[] =
      item.image_urls?.map((url, index) => ({
        id: `history-${item.uuid}-${index}`,
        type: 'url' as const,
        url,
      })) || [];

    const inputFields = item.prompt_data?.inputs
      ? (objectToCamelCase(item.prompt_data.inputs) as Record<string, string>)
      : {};

    set({
      count: item.max_images,
      dimensions,
      generatedImages: item.result_urls || [],
      generationStatus: item.state === 'success' ? 'success' : 'idle',
      imageInputs,
      inputFields,
      showHistory: false, // Close history panel
      style: (item.prompt_data?.style as StylePresetKey) || 'plain',
    });
  },
  loadHistory: async () => {
    if (get().historyLoading) return;

    set({ historyError: null, historyLoading: true, historyOffset: 0 });

    try {
      const result = await getAiImageHistory();

      if ('error' in result) {
        set({ historyError: result.error, historyLoading: false });

        return;
      }

      set({ historyItems: result.data, historyLoading: false, historyOffset: result.data.length });
    } catch (error) {
      set({
        historyError: error instanceof Error ? error.message : 'Failed to load history',
        historyLoading: false,
      });
    }
  },
  removeImageInput: (id) => {
    set((state) => ({ imageInputs: state.imageInputs.filter((input) => input.id !== id) }));
  },
  resetForm: () => {
    set({ ...formInitialState });
  },
  setInputField: (key, value) => {
    set((state) => ({ inputFields: { ...state.inputFields, [key]: value } }));
  },
  setState: (state) => {
    set((originalState) => ({ ...originalState, ...state }));
  },
  setStyle: (style) => {
    set((state) => {
      const newStyle = style || 'plain';
      const styleCategoryKey = getStyleConfig(newStyle).id;
      const newFieldKeys = new Set(styleCategoryKey ? getStylePreset(styleCategoryKey).map((field) => field.key) : []);

      // Filter existing inputs to only keep ones valid for the new style
      const preservedFields = Object.fromEntries(
        Object.entries(state.inputFields).filter(([key]) => newFieldKeys.has(key)),
      );

      // Reset laser-friendly toggle when changing style
      return { inputFields: preservedFields, isLaserFriendly: false, style: newStyle };
    });
  },
  toggleFixedSeed: () => {
    set((state) => {
      const newIsFixedSeed = !state.isFixedSeed;

      return {
        isFixedSeed: newIsFixedSeed,
        seed: newIsFixedSeed ? state.seed : undefined,
      };
    });
  },
  toggleHistory: () => {
    set((state) => {
      const newShowHistory = !state.showHistory;

      if (newShowHistory && !state.historyLoading && state.historyItems.length === 0) {
        get().loadHistory();
      }

      return { showHistory: newShowHistory };
    });
  },
  toggleLaserFriendly: () => {
    set((state) => {
      const newIsLaserFriendly = !state.isLaserFriendly;
      const laserFriendlyText =
        'pure black and white, monochrome, high contrast, line art, no gradients, no shading, suitable for engraving';

      // If turning ON: add color field with predefined text
      // If turning OFF: remove color field
      const updatedFields = { ...state.inputFields };

      if (newIsLaserFriendly) {
        updatedFields.color = laserFriendlyText;
      } else {
        delete updatedFields.color;
      }

      return {
        inputFields: updatedFields,
        isLaserFriendly: newIsLaserFriendly,
      };
    });
  },
  updateHistoryItem: (uuid, updates) => {
    set((state) => ({
      historyItems: state.historyItems.map((item) => (item.uuid === uuid ? { ...item, ...updates } : item)),
    }));
  },
}));
