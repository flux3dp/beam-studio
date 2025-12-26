import { create } from 'zustand';

import type { AiImageGenerationData } from '@core/helpers/api/ai-image';
import { getAiImageHistory } from '@core/helpers/api/ai-image';
import type { Style } from '@core/helpers/api/ai-image-config';
import { fluxIDEvents, getCurrentUser } from '@core/helpers/api/flux-id';
import type { IUser } from '@core/interfaces/IUser';

import type { GenerationStatus, ImageDimensions, ImageInput } from './types';
import { LASER_FRIENDLY_VALUE } from './types';
import { getStyleConfig } from './utils/categories';
import { getInputFieldsForStyle } from './utils/inputFields';

interface State {
  dimensions: ImageDimensions;
  // UI & Status
  errorMessage: null | string;
  generatedImages: string[];
  generationStatus: GenerationStatus;
  generationUuid: null | string;
  // Global state (shared across desktop/mobile)
  hasInitializedStyle: boolean;
  // History Data
  historyError: null | string;
  historyItems: AiImageGenerationData[];
  historyLoading: boolean;
  historyOffset: number;
  imageInputs: ImageInput[];
  inputFields: Record<string, string>;
  isGenerateDisabled: boolean;
  isLaserFriendly: boolean;
  // Form
  maxImages: number;
  // Scroll control - increment scrollTrigger to trigger a scroll
  scrollTarget: 'bottom' | 'top';
  scrollTrigger: number;
  showHistory: boolean;
  styleId: string;
  user: IUser | null;
}

interface Actions {
  addImageInput: (input: ImageInput) => void;

  clearGenerationResults: () => void;
  clearImageInputs: () => void;

  importFromHistory: (item: AiImageGenerationData) => void;
  loadHistory: () => Promise<void>;
  markStyleInitialized: () => void;
  removeImageInput: (id: string) => void;
  resetForm: () => void;

  setGenerateDisabled: (disabled: boolean) => void;
  setInputField: (key: string, value: string) => void;
  setState: (state: Partial<State>) => void;
  setStyle: (styleId: string, styles?: Style[]) => void;
  setUser: (user: IUser | null) => void;

  toggleHistory: () => void;
  toggleLaserFriendly: () => void;
  triggerScroll: (target: 'bottom' | 'top') => void;
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
  styleId: 'customize',
};

const INITIAL_STATE: State = {
  ...FORM_DEFAULTS,
  hasInitializedStyle: false,
  historyError: null,
  historyItems: [],
  historyLoading: false,
  historyOffset: 0,
  isGenerateDisabled: false,
  scrollTarget: 'top',
  scrollTrigger: 0,
  showHistory: false,
  user: getCurrentUser(),
};

export const useAiGenerateStore = create<Actions & State>((set, get) => ({
  ...INITIAL_STATE,
  addImageInput: (input) => set((state) => ({ imageInputs: [...state.imageInputs, input] })),
  clearGenerationResults: () =>
    set({ errorMessage: null, generatedImages: [], generationStatus: 'idle', generationUuid: null }),
  clearImageInputs: () => set({ imageInputs: [] }),
  importFromHistory: (item) => {
    const dimensions: ImageDimensions = { aspectRatio: item.aspect_ratio, size: item.size };
    const { inputs } = item.prompt_data;

    // Remove imageCounts from inputs as it is not needed and automatically handled from maxImages
    delete inputs['image_counts'];

    if (inputs.color === LASER_FRIENDLY_VALUE) {
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
      styleId: item.prompt_data?.style || 'customize',
    });
    get().toggleHistory();
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
  markStyleInitialized: () => set({ hasInitializedStyle: true }),
  removeImageInput: (id) => set((state) => ({ imageInputs: state.imageInputs.filter((i) => i.id !== id) })),
  resetForm: () => set({ ...FORM_DEFAULTS, hasInitializedStyle: false }),
  setGenerateDisabled: (isGenerateDisabled) => set({ isGenerateDisabled }),
  setInputField: (key, value) => set((state) => ({ inputFields: { ...state.inputFields, [key]: value } })),
  setState: (updates) => set((state) => ({ ...state, ...updates })),
  setStyle: (styleId = 'customize', styles = []) =>
    set((state) => {
      const styleConfig = getStyleConfig(styleId, styles);
      const validKeys = new Set(getInputFieldsForStyle(styleConfig.id, styles).map((f) => f.key));
      const inputFields = Object.fromEntries(Object.entries(state.inputFields).filter(([key]) => validKeys.has(key)));

      return { inputFields, isLaserFriendly: false, styleId };
    }),
  setUser: (user) => set({ user }),
  toggleHistory: () => {
    const { historyLoading, scrollTrigger, showHistory } = get();

    if (!showHistory && !historyLoading) {
      get().loadHistory();
    }

    // Trigger scroll to top when toggling history
    set({ scrollTarget: 'top', scrollTrigger: scrollTrigger + 1, showHistory: !showHistory });
  },
  toggleLaserFriendly: () =>
    set((s) => {
      const isLaserFriendly = !s.isLaserFriendly;
      const inputFields = { ...s.inputFields };

      if (isLaserFriendly) {
        inputFields.color = LASER_FRIENDLY_VALUE;
      } else {
        delete inputFields.color;
      }

      return { inputFields, isLaserFriendly };
    }),
  triggerScroll: (scrollTarget) => set((state) => ({ scrollTarget, scrollTrigger: state.scrollTrigger + 1 })),
  updateHistoryItem: (uuid, updates) =>
    set((state) => ({
      historyItems: state.historyItems.map((item) => (item.uuid === uuid ? { ...item, ...updates } : item)),
    })),
}));

// Setup global user event listener (runs once when module loads)
fluxIDEvents.on('update-user', (user: IUser | null) => {
  useAiGenerateStore.setState({ user });
});
