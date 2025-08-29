import { create } from 'zustand';
import { combine } from 'zustand/middleware';

import { VerticalAlign } from '@core/app/actions/beambox/textPathEdit';
import type { TextConfig, TextOption } from '@core/interfaces/ObjectPanel';

interface FontOption {
  family?: string;
  label: React.ReactNode;
  value: string;
}

interface TextOptionsState {
  // Font management
  availableFontFamilies: string[];

  // Core text configuration
  configs: TextConfig;
  currentElementId: string;

  // Font history
  fontHistory: string[];

  // Text operations - will be set by parent component
  handleFontFamilyChange: ((newFamily: string, option: FontOption) => Promise<void>) | null;

  handleFontSizeChange: ((size: number) => void) | null;

  handleFontStyleChangeWithFamily: ((style: string, fontFamily: string) => Promise<void>) | null;
  handleLetterSpacingChange: ((spacing: number) => void) | null;
  handleLineSpacingChange: ((spacing: number) => void) | null;
  handleStartOffsetChange: ((offset: number) => void) | null;
  handleVerticalAlignChange: ((align: number) => void) | null;
  handleVerticalTextChange: ((isVertical: boolean) => void) | null;
  // UI state
  isLoading: boolean;
  styleOptions: FontOption[];
}

interface TextOptionsActions {
  // Font history
  addToFontHistory: (family: string) => void;
  resetConfigs: () => void;

  // Font management
  setAvailableFontFamilies: (families: string[]) => void;
  setConfigs: (configs: TextConfig) => void;
  setCurrentElementId: (id: string) => void;
  setFontHistory: (history: string[]) => void;
  // UI state
  setLoading: (isLoading: boolean) => void;
  // Set operations from parent component
  setOperations: (operations: {
    handleFontFamilyChange: (newFamily: string, option: FontOption) => Promise<void>;
    handleFontSizeChange: (size: number) => void;
    handleFontStyleChangeWithFamily: (style: string, fontFamily: string) => Promise<void>;
    handleLetterSpacingChange: (spacing: number) => void;
    handleLineSpacingChange: (spacing: number) => void;
    handleStartOffsetChange: (offset: number) => void;
    handleVerticalAlignChange: (align: number) => void;
    handleVerticalTextChange: (isVertical: boolean) => void;
  }) => void;
  setStyleOptions: (options: FontOption[]) => void;

  // Configuration updates
  updateConfig: <T extends keyof TextOption>(key: T, value: TextOption[T]) => void;
}

export const defaultTextConfigs: TextConfig = {
  fontFamily: { hasMultiValue: false, value: '' },
  fontSize: { hasMultiValue: false, value: 200 },
  fontStyle: { hasMultiValue: false, value: '' },
  id: { hasMultiValue: false, value: '' },
  isVertical: { hasMultiValue: false, value: false },
  letterSpacing: { hasMultiValue: false, value: 0 },
  lineSpacing: { hasMultiValue: false, value: 1 },
  startOffset: { hasMultiValue: false, value: 0 },
  verticalAlign: { hasMultiValue: false, value: VerticalAlign.MIDDLE },
};

const getDefaultState = (): TextOptionsState => ({
  availableFontFamilies: [],
  configs: defaultTextConfigs,
  currentElementId: '',
  fontHistory: [],
  // Operations will be null initially
  handleFontFamilyChange: null,
  handleFontSizeChange: null,
  handleFontStyleChangeWithFamily: null,
  handleLetterSpacingChange: null,
  handleLineSpacingChange: null,
  handleStartOffsetChange: null,
  handleVerticalAlignChange: null,
  handleVerticalTextChange: null,
  isLoading: false,
  styleOptions: [],
});

export interface TextOptionsStore extends TextOptionsState, TextOptionsActions {}

const maxHistory = 5;

export const useTextOptionsStore = create<TextOptionsStore>(
  combine(getDefaultState(), (set) => ({
    addToFontHistory: (family: string) =>
      set((state) => {
        if (!family) return state;

        const newHistory = state.fontHistory.filter((name: string) => name !== family);

        newHistory.unshift(family);

        if (newHistory.length > maxHistory) newHistory.pop();

        return { fontHistory: newHistory };
      }),

    resetConfigs: () => set({ configs: defaultTextConfigs }),

    setAvailableFontFamilies: (families: string[]) => set({ availableFontFamilies: families }),

    setConfigs: (configs: TextConfig) => set({ configs: { ...defaultTextConfigs, ...configs } }),

    setCurrentElementId: (id: string) => set({ currentElementId: id }),

    setFontHistory: (history: string[]) => set({ fontHistory: history }),

    setLoading: (isLoading: boolean) => set({ isLoading }),

    setOperations: (operations) => set(operations),

    setStyleOptions: (options: FontOption[]) => set({ styleOptions: options }),

    updateConfig: <T extends keyof TextOption>(key: T, value: TextOption[T]) =>
      set((state) => ({ configs: { ...state.configs, [key]: { hasMultiValue: false, value } } })),
  })),
);

// Selectors for common state patterns
export const useTextOptionsSelectors = () => {
  const store = useTextOptionsStore();

  return {
    // Get current font configuration
    getCurrentFontConfig: () => ({
      family: store.configs.fontFamily.value,
      size: store.configs.fontSize.value,
      style: store.configs.fontStyle.value,
    }),

    // Get multi-line text configs
    getMultiLineTextConfigs: () => ({
      isVertical: store.configs.isVertical,
      letterSpacing: store.configs.letterSpacing,
      lineSpacing: store.configs.lineSpacing,
    }),

    // Get text path specific configs
    getTextPathConfigs: () => ({
      startOffset: store.configs.startOffset,
      verticalAlign: store.configs.verticalAlign,
    }),

    // Check if any config has multi-value
    hasAnyMultiValue: () => Object.values(store.configs).some((config) => config.hasMultiValue),

    // Check if element has changed
    hasElementChanged: (elementId: string) => store.currentElementId !== elementId,
  };
};
