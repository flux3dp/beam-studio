/* eslint-disable @typescript-eslint/ban-types */
import { IButton } from './IButton';

export type MessageIcon = 'notice' | 'error' | 'info' | 'success' | 'warning';

export interface IAlert {
  id?: string;
  key?: number;
  type?: string;
  message: string | JSX.Element;
  messageIcon?: MessageIcon;
  caption?: string;
  iconUrl?: string;
  children?: Element;
  buttons?: IButton[];
  buttonType?: string;
  buttonLabels?: string[];
  callbacks?: Function | Function[];
  primaryButtonIndex?: number;
  onYes?: Function;
  onNo?: Function;
  onConfirm?: Function;
  onRetry?: Function;
  onCancel?: Function;
  links?: {
    text: string;
    url: string;
  }[];
  checkbox?: {
    text: string;
    callbacks: Function | Function[];
  };
  isProgress?: false;
}
