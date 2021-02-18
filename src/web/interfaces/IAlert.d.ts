import { IButton } from './IButton';

export interface IAlert {
    id?: string,
    type?: string,
    message?: string,
    caption?: string,
    iconUrl?: string,
    children?: Element,
    buttons?: IButton | IButton[],
    buttonType?: string,
    buttonLabels?: string | string[], 
    callbacks?: Function | Function[],
    primaryButtonIndex?: number,
    onYes?: Function,
    onNo?: Function,
    onConfirm?: Function,
    onRetry?: Function,
    onCancel?: Function,
    checkbox?: ICheckbox,
}

export interface ICheckbox {
    text: string,
    callbacks: Function | Function[],
}