import { CSSProperties, ReactNode } from 'react';

export enum MessageLevel {
  OPEN,
  SUCCESS,
  ERROR,
  INFO,
  WARNING,
  LOADING,
}

export interface IMessage {
  level: MessageLevel,
  className?: string,
  content: string | ReactNode,
  duration?: number,
  icon?: ReactNode,
  key?: string,
  style?: CSSProperties,
  onClick?: () => void,
  onClose?: () => void,
}
