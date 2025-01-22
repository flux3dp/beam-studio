import type { CSSProperties, ReactNode } from 'react';

export enum MessageLevel {
  OPEN,
  SUCCESS,
  ERROR,
  INFO,
  WARNING,
  LOADING,
}

export interface IMessage {
  className?: string;
  content: ReactNode | string;
  duration?: number;
  icon?: ReactNode;
  key?: string;
  level: MessageLevel;
  onClick?: () => void;
  onClose?: () => void;
  style?: CSSProperties;
}
