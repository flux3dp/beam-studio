export type ArrowDirection = 'bottom' | 'left' | 'right' | 'top';
export interface IDialogBoxStyle {
  arrowColor?: string;
  arrowDirection?: ArrowDirection;
  arrowHeight?: number;
  arrowPadding?: number | undefined;
  arrowWidth?: number;
  position: {
    bottom?: number;
    left?: number;
    right?: number;
    top?: number;
  };
}

export interface IPrompt {
  caption?: string;
  defaultValue?: string;
  message?: string;
  onCancel?: () => void;
  onYes?: (value?: string) => void;
}

export interface IInputLightBox {
  caption: string;
  confirmText?: string;
  defaultValue?: string;
  inputHeader?: string;
  isOpen?: boolean;
  maxLength?: number;
  onCancel?: () => void;
  onClose?: (from?: string) => void;
  onSubmit: (value: string, event?: Event) => Promise<void> | void;
  type: string;
}

export interface DialogFilter {
  extensions: string[];
  name: string;
}
export type OpenDialogProperties = 'createDirectory' | 'openDirectory' | 'openFile' | 'promptToCreate';
export interface IDialog {
  getFileFromDialog(options: {
    defaultPath?: string;
    filters?: DialogFilter[];
    properties?: OpenDialogProperties[];
  }): Promise<File>;
  showOpenDialog(options: {
    defaultPath?: string;
    filters?: DialogFilter[];
    properties?: OpenDialogProperties[];
  }): Promise<{
    canceled: boolean;
    filePaths: string[];
  }>;
  showSaveDialog(title?: string, defaultPath?: string, filters?: DialogFilter[]): Promise<null | string>;
  writeFileDialog(
    getContent: () => Blob | Promise<Blob | string> | string,
    title?: string,
    defaultPath?: string,
    filters?: DialogFilter[],
  ): Promise<null | string>;
}
