import { create } from 'zustand';

export type AspectRatio = '1:1' | '4:3' | '16:9' | 'custom';
export type ImageSize = 'large' | 'medium' | 'small';
export type StyleType = 'illustration' | 'logo_with_text' | 'pattern';
export type Orientation = 'landscape' | 'portrait';
export type GenerationStatus = 'failed' | 'generating' | 'idle' | 'success';

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
  isAiGenerateShown: boolean;
  patternDescription: string;
  selectedStyle: StyleType;
  textToDisplay: string;
}

interface Actions {
  clearGenerationResults: () => void;
  resetForm: () => void;
}

const initialState: State = {
  count: 1,
  dimensions: { aspectRatio: '1:1', orientation: 'landscape', size: 'small' },
  errorMessage: null,
  generatedImages: [],
  generationStatus: 'idle',
  generationUuid: null,
  isAiGenerateShown: false,
  patternDescription: '',
  selectedStyle: 'logo_with_text',
  textToDisplay: '',
};

export const useAiGenerateStore = create<Actions & State>((set) => ({
  ...initialState,
  clearGenerationResults: () => {
    set({ errorMessage: null, generatedImages: [], generationStatus: 'idle', generationUuid: null });
  },
  resetForm: () => {
    set({
      count: initialState.count,
      dimensions: initialState.dimensions,
      errorMessage: null,
      generatedImages: [],
      generationStatus: 'idle',
      generationUuid: null,
      patternDescription: initialState.patternDescription,
      selectedStyle: initialState.selectedStyle,
      textToDisplay: initialState.textToDisplay,
    });
  },
}));
