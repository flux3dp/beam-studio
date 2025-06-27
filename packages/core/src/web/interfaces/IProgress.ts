export const ProgressTypes = {
  NONSTOP: 1,
  STEPPING: 2,
} as const;

export type ProgressType = (typeof ProgressTypes)[keyof typeof ProgressTypes];

export interface IProgress {
  step: number;
  total: number;
}

export interface IProgressDialog {
  /**
   * Whether the progress can be canceled by the user.
   * only used when type is 'stepping' or 'nonstop'.
   */
  canCancel?: boolean;
  caption?: string;
  id?: string;
  isProgress?: boolean;
  key?: number;
  message?: string;
  onCancel?: () => void;
  percentage?: number | string;
  progressKey?: string;
  timeout?: number;
  type?: ProgressType;
}
