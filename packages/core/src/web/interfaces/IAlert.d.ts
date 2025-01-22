import type { IButton } from './IButton';

export type MessageIcon = 'error' | 'info' | 'notice' | 'success' | 'warning';

export interface IAlert {
  buttonLabels?: string[];
  buttons?: IButton[];
  buttonType?: string;
  callbacks?: Function | Function[];
  caption?: string;
  checkbox?: {
    callbacks: Function | Function[];
    text: string;
  };
  children?: Element;
  iconUrl?: string;
  id?: string;
  isProgress?: false;
  key?: number;
  links?: Array<{
    text: string;
    url: string;
  }>;
  message: React.JSX.Element | string;
  messageIcon?: MessageIcon;
  onCancel?: Function;
  onConfirm?: Function;
  onNo?: Function;
  onRetry?: Function;
  onYes?: Function;
  primaryButtonIndex?: number;
  type?: string;
}
