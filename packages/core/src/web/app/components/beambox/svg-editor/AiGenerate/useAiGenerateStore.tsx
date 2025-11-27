import { create } from 'zustand';

import type { AiImageGenerationData } from '@core/helpers/api/ai-image';
import { getAiImageHistory } from '@core/helpers/api/ai-image';
import type { StyleWithInputFields } from '@core/helpers/api/ai-image-config';

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
import { getInputFieldsForStyle } from './utils/inputFields';

interface State {
  // Form
  count: number;
  dimensions: ImageDimensions;
  // UI & Status
  errorMessage: null | string;
  generatedImages: string[];
  generationStatus: GenerationStatus;
  generationUuid: null | string;
  // History Data
  historyError: null | string;
  historyItems: AiImageGenerationData[];
  historyLoading: boolean;
  historyOffset: number;
  imageInputs: ImageInput[];
  inputFields: Record<string, string>;
  isAiGenerateShown: boolean;
  isFixedSeed: boolean;
  isLaserFriendly: boolean;
  seed?: number;
  showHistory: boolean;
  style: string;
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
  setStyle: (style: string, stylesWithFields?: StyleWithInputFields[]) => void;

  toggleFixedSeed: () => void;
  toggleHistory: () => void;
  toggleLaserFriendly: () => void;
  updateHistoryItem: (uuid: string, updates: Partial<AiImageGenerationData>) => void;
}

const FORM_DEFAULTS = {
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
  style: 'plain',
};

const INITIAL_STATE: State = {
  ...FORM_DEFAULTS,
  historyError: null,
  historyItems: [],
  historyLoading: false,
  historyOffset: 0,
  isAiGenerateShown: false,
  showHistory: false,
};

export const useAiGenerateStore = create<Actions & State>((set, get) => ({
  ...INITIAL_STATE,
  addImageInput: (input) => set((state) => ({ imageInputs: [...state.imageInputs, input] })),
  addPendingHistoryItem: ({ count, dimensions, imageInputs, uuid }) =>
    set((state) => {
      const newItem: AiImageGenerationData = {
        completed_at: null,
        cost_time: null,
        created_at: new Date().toISOString(),
        fail_msg: null,
        image_resolution: getImageResolution(dimensions),
        image_size: getImageSizeOption(dimensions),
        image_urls: imageInputs.map((i) => (i.type === 'url' ? i.url : '')).filter(Boolean),
        max_images: count,
        prompt_data: { inputs: state.inputFields, style: state.style },
        result_urls: null,
        state: 'pending',
        task_id: null,
        uuid,
      };

      return { historyItems: [newItem, ...state.historyItems] };
    }),
  clearGenerationResults: () =>
    set({ errorMessage: null, generatedImages: [], generationStatus: 'idle', generationUuid: null }),
  clearImageInputs: () => set({ imageInputs: [] }),
  importFromHistory: (item) => {
    const dimensions: ImageDimensions = {
      aspectRatio: getAspectRatioFromImageSize(item.image_size),
      orientation: getOrientationFromImageSize(item.image_size),
      size: getSizeFromImageResolution(item.image_resolution),
    };
    const inputs = item.prompt_data?.inputs
      ? (objectToCamelCase(item.prompt_data.inputs) as Record<string, string>)
      : {};

    set({
      count: item.max_images,
      dimensions,
      generatedImages: item.result_urls || [],
      generationStatus: item.state === 'success' ? 'success' : 'idle',
      imageInputs: item.image_urls?.map((url, i) => ({ id: `hist-${item.uuid}-${i}`, type: 'url', url })) || [],
      inputFields: inputs,
      showHistory: false,
      style: (item.prompt_data?.style as string) || 'plain',
    });
  },
  loadHistory: async () => {
    if (get().historyLoading) return;

    set({ historyError: null, historyLoading: true, historyOffset: 0 });

    try {
      const res = await getAiImageHistory();

      if ('error' in res) {
        set({ historyError: res.error, historyLoading: false });
      } else {
        set({ historyItems: res.data, historyLoading: false, historyOffset: res.data.length });
      }
    } catch (err) {
      set({ historyError: err instanceof Error ? err.message : 'History load failed', historyLoading: false });
    }
  },
  removeImageInput: (id) => set((state) => ({ imageInputs: state.imageInputs.filter((i) => i.id !== id) })),
  resetForm: () => set({ ...FORM_DEFAULTS }),
  setInputField: (key, value) => set((state) => ({ inputFields: { ...state.inputFields, [key]: value } })),
  setState: (updates) => set((state) => ({ ...state, ...updates })),
  setStyle: (style, stylesWithFields) =>
    set((state) => {
      const newStyle = style || 'plain';
      const styleId = getStyleConfig(newStyle).id;
      const validKeys = new Set(getInputFieldsForStyle(styleId, stylesWithFields).map((f) => f.key));
      const inputFields = Object.fromEntries(Object.entries(state.inputFields).filter(([key]) => validKeys.has(key)));

      return { inputFields, isLaserFriendly: false, style: newStyle };
    }),
  toggleFixedSeed: () => set((s) => ({ isFixedSeed: !s.isFixedSeed, seed: !s.isFixedSeed ? s.seed : undefined })),
  toggleHistory: () => {
    const { historyItems, historyLoading, showHistory } = get();

    if (!showHistory && !historyLoading && historyItems.length === 0) {
      get().loadHistory();
    }

    set({ showHistory: !showHistory });
  },
  toggleLaserFriendly: () =>
    set((s) => {
      const isLaserFriendly = !s.isLaserFriendly;
      const inputFields = { ...s.inputFields };

      if (isLaserFriendly) {
        inputFields.color =
          'pure black and white, monochrome, high contrast, line art, no gradients, no shading, suitable for engraving';
      } else {
        delete inputFields.color;
      }

      return { inputFields, isLaserFriendly };
    }),
  updateHistoryItem: (uuid, updates) =>
    set((state) => ({
      historyItems: state.historyItems.map((item) => (item.uuid === uuid ? { ...item, ...updates } : item)),
    })),
}));
