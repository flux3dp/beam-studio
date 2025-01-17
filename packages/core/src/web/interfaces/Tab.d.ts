import CanvasMode from 'app/constants/canvasMode';

export interface Tab {
  id: number;
  title: string;
  isCloud: boolean;
  isLoading: boolean;
  mode?: CanvasMode;
}

export default Tab;
