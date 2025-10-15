import { create } from 'zustand';

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
  isAiGenerateShown: boolean;
  mode: GenerationMode;
  patternDescription: string;
  selectedImages: File[];
  selectedStyle: StyleType;
  textToDisplay: string;
}

interface Actions {
  addSelectedImage: (file: File) => void;
  clearGenerationResults: () => void;
  clearSelectedImages: () => void;
  removeSelectedImage: (index: number) => void;
  resetForm: () => void;
  setMode: (mode: GenerationMode) => void;
}

const initialState: State = {
  count: 1,
  dimensions: { aspectRatio: '1:1', orientation: 'landscape', size: 'small' },
  errorMessage: null,
  generatedImages: [],
  generationStatus: 'idle',
  generationUuid: null,
  isAiGenerateShown: false,
  mode: 'text-to-image',
  patternDescription: '',
  selectedImages: [],
  selectedStyle: 'logo_with_text',
  textToDisplay: '',
};

export const useAiGenerateStore = create<Actions & State>((set) => ({
  ...initialState,
  addSelectedImage: (file) => {
    set((state) => ({ selectedImages: [...state.selectedImages, file] }));
  },
  clearGenerationResults: () => {
    set({ errorMessage: null, generatedImages: [], generationStatus: 'idle', generationUuid: null });
  },
  clearSelectedImages: () => {
    set({ selectedImages: [] });
  },
  removeSelectedImage: (index) => {
    set((state) => ({ selectedImages: state.selectedImages.filter((_, i) => i !== index) }));
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
      selectedStyle: initialState.selectedStyle,
      textToDisplay: initialState.textToDisplay,
    });
  },
  setMode: (mode) => {
    set({ mode });
  },
}));
