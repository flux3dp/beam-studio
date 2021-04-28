import { IButton } from './IButton';

export interface IDialogBoxStyle {
  position: {
    top?: number,
    bottom?: number,
    left?: number,
    right?: number,
  },
  arrowDirection?: string,
  arrowPadding?: number | undefined,
  arrowHeight?: number,
  arrowWidth?: number,
  arrowColor?: string,
}

export interface IPrompt {
  buttons?: IButton[],
  caption?: string,
  defaultValue?: string,
  onYes?: (value?: string) => void,
  onNo?: (value?: string) => void,
  onCancel?: () => void,
  closeOnBackgroundClick?: boolean,
}

export interface IInputLightBox {
  isOpen?: boolean,
  type: string,
  caption: string,
  maxLength?: number,
  inputHeader?: string,
  defaultValue?: string,
  confirmText?: string,
  onSubmit: (value: string, event?: Event) => void | Promise<void>,
  onCancel?: () => void,
  onClose?: (from?: string) => void,
}
