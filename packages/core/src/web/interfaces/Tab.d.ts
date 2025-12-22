import type { CanvasMode } from '@core/app/constants/canvasMode';

export interface Tab {
  hasUnsavedChanges?: boolean;
  id: number;
  isCloud: boolean;
  isLoading: boolean;
  isPreviewMode: boolean;
  isWelcomeTab: boolean;
  mode?: CanvasMode;
  title: string;
}

export default Tab;
