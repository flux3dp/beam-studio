import { clipboardCore } from './singleton';

export const hasClipboardData = async (): Promise<boolean> => clipboardCore.hasData();

export * from './actions';
export * from './helpers/paste';
