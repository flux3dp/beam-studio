export interface IProgress {
  step: number;
  total: number;
}

export interface IProgressDialog {
  caption?: string;
  id?: string;
  isProgress?: boolean;
  key?: number;
  message?: string;
  onCancel?: () => void;
  percentage?: number | string;
  progressKey?: string;
  timeout?: number;
  type?: string;
}
