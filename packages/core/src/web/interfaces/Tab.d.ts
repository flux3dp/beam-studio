import type { CanvasMode } from '@core/app/constants/canvasMode';

export interface Tab {
  id: number;
  isCloud: boolean;
  isLoading: boolean;
  isWelcomeTab: boolean;
  mode?: CanvasMode;
  title: string;
}

export default Tab;
