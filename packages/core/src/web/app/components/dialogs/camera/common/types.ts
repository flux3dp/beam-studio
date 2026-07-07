import type React from 'react';

export interface WrapperButton {
  disabled?: boolean;
  label: string;
  onClick: () => void;
  primary?: boolean;
}

export type RenderWrapper = (props: {
  buttons: WrapperButton[];
  content: React.ReactNode;
  media?: React.ReactNode;
  title?: React.ReactNode;
}) => React.JSX.Element;
