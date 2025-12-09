import { create } from 'zustand';

import type { AiImageGenerationData } from '@core/helpers/api/ai-image';
import { getAiImageHistory } from '@core/helpers/api/ai-image';
import type { Style } from '@core/helpers/api/ai-image-config';

import type { GenerationStatus, ImageDimensions, ImageInput } from './types';
import { laserFriendlyValue } from './types';
import { objectToCamelCase } from './utils/caseConversion';
import { getStyleConfig } from './utils/categories';
import { getInputFieldsForStyle } from './utils/inputFields';

interface State {
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
  isLaserFriendly: boolean;
  // Form
  maxImages: number;
  showHistory: boolean;
  style: string;
}

interface Actions {
  addImageInput: (input: ImageInput) => void;

  clearGenerationResults: () => void;
  clearImageInputs: () => void;

  importFromHistory: (item: AiImageGenerationData) => void;
  loadHistory: () => Promise<void>;
  removeImageInput: (id: string) => void;
  resetForm: () => void;

  setInputField: (key: string, value: string) => void;
  setState: (state: Partial<State>) => void;
  setStyle: (style: string, styles?: Style[]) => void;

  toggleHistory: () => void;
  toggleLaserFriendly: () => void;
  updateHistoryItem: (uuid: string, updates: Partial<AiImageGenerationData>) => void;
}

const FORM_DEFAULTS = {
  dimensions: { aspectRatio: '1:1', size: '1K' } as ImageDimensions,
  errorMessage: null,
  generatedImages: [],
  generationStatus: 'idle' as GenerationStatus,
  generationUuid: null,
  imageInputs: [],
  inputFields: {},
  isLaserFriendly: false,
  maxImages: 1,
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
  clearGenerationResults: () =>
    set({ errorMessage: null, generatedImages: [], generationStatus: 'idle', generationUuid: null }),
  clearImageInputs: () => set({ imageInputs: [] }),
  importFromHistory: (item) => {
    const dimensions: ImageDimensions = { aspectRatio: item.aspect_ratio, size: item.size };
    const inputs = objectToCamelCase(item.prompt_data.inputs) as Record<string, string>;

    // Remove imageCounts from inputs as it is not needed and automatically handled from maxImages
    delete inputs['imageCounts'];

    if (inputs.color === laserFriendlyValue) {
      set({ isLaserFriendly: true });
      delete inputs['color'];
    } else {
      set({ isLaserFriendly: false });
    }

    set({
      dimensions,
      generatedImages: item.result_urls || [],
      generationStatus: item.state === 'success' ? 'success' : 'idle',
      imageInputs: item.image_urls?.map((url, i) => ({ id: `hist-${item.uuid}-${i}`, type: 'url', url })) || [],
      inputFields: inputs,
      maxImages: item.max_images,
      showHistory: false,
      style: item.prompt_data?.style || 'plain',
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
  setStyle: (style, styles) =>
    set((state) => {
      const newStyle = style || 'plain';
      const styleId = getStyleConfig(newStyle).id;
      const validKeys = new Set(getInputFieldsForStyle(styleId, styles).map((f) => f.key));
      const inputFields = Object.fromEntries(Object.entries(state.inputFields).filter(([key]) => validKeys.has(key)));

      return { inputFields, isLaserFriendly: false, style: newStyle };
    }),
  toggleHistory: () => {
    const { historyLoading, showHistory } = get();

    if (!showHistory && !historyLoading) {
      get().loadHistory();
    }

    set({ showHistory: !showHistory });
  },
  toggleLaserFriendly: () =>
    set((s) => {
      const isLaserFriendly = !s.isLaserFriendly;
      const inputFields = { ...s.inputFields };

      if (isLaserFriendly) {
        inputFields.color = laserFriendlyValue;
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
