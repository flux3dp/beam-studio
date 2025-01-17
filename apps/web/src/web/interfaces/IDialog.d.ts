export type ArrowDirection = 'top' | 'left' | 'bottom' | 'right';
export interface IDialogBoxStyle {
  position: {
    top?: number,
    bottom?: number,
    left?: number,
    right?: number,
  },
  arrowDirection?: ArrowDirection,
  arrowPadding?: number | undefined,
  arrowHeight?: number,
  arrowWidth?: number,
  arrowColor?: string,
}

export interface IPrompt {
  caption?: string,
  message?: string,
  defaultValue?: string,
  onYes?: (value?: string) => void,
  onCancel?: () => void,
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

export interface DialogFilter {
  name: string;
  extensions: string[];
}
export type OpenDialogProperties = 'openFile' | 'openDirectory' | 'createDirectory' | 'promptToCreate';
export interface IDialog {
  showSaveDialog(
    title?: string,
    defaultPath?: string,
    filters?: DialogFilter[],
  ): Promise<string | null>;
  writeFileDialog(
    getContent: () => string | Blob | Promise<string | Blob>,
    title?: string,
    defaultPath?: string,
    filters?: DialogFilter[],
  ): Promise<string | null>;
  showOpenDialog(options: {
    defaultPath?: string,
    filters?: DialogFilter[],
    properties?: OpenDialogProperties[],
  }): Promise<{
    canceled: boolean,
    filePaths: string[],
  }>;
  getFileFromDialog(options: {
    defaultPath?: string,
    filters?: DialogFilter[],
    properties?: OpenDialogProperties[],
  }): Promise<File>;
}
