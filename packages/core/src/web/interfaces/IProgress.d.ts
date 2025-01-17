export interface IProgress {
  step: number,
  total: number
}

export interface IProgressDialog {
  id?: string,
  key?: number;
  type?: string,
  caption?: string,
  message?: string,
  onCancel?: () => void,
  percentage?: number | string,
  timeout?: number,
  isProgress?: boolean,
}
