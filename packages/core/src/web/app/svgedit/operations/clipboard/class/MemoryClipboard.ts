import type { ClipboardCore } from '@core/interfaces/Clipboard';

import { Clipboard } from './Clipboard';

export class MemoryClipboard extends Clipboard implements ClipboardCore {
  private clipboardData: Element[] = [];

  protected writeDataToClipboard = async (elems: Element[]): Promise<void> => {
    this.clipboardData = [...elems];
  };

  getRawData = async (): Promise<null> => null; // MemoryClipboard does not support raw data

  getData = async (): Promise<Element[]> => this.clipboardData;

  hasData = async (): Promise<boolean> => this.clipboardData.length > 0;
}
