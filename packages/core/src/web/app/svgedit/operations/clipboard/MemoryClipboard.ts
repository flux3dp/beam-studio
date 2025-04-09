import type { ClipboardCore } from '@core/interfaces/Clipboard';

import BaseClipboardCore from './base';

export class MemoryClipboard extends BaseClipboardCore implements ClipboardCore {
  private clipboardData: Element[] = [];

  protected writeDataToClipboard = async (elems: Element[]): Promise<void> => {
    this.clipboardData = [...elems];
  };

  getData = async (): Promise<Element[]> => {
    return this.clipboardData;
  };

  hasData = async (): Promise<boolean> => {
    return this.clipboardData.length > 0;
  };
}

export default MemoryClipboard;
