import type { ClipboardCore, ClipboardData } from '@core/interfaces/Clipboard';

import { Clipboard } from './Clipboard';

export class MemoryClipboard extends Clipboard implements ClipboardCore {
  private clipboardData: Element[] = [];
  private id: string = '';

  protected writeDataToClipboard = async (elems: Element[]): Promise<void> => {
    this.id = crypto.randomUUID();
    this.clipboardData = [...elems];
  };

  getRawData = async (): Promise<ClipboardData | null> =>
    // only provide id and source for paste check
    this.clipboardData.length ? ({ id: this.id, source: 'web' } as ClipboardData) : null;

  getData = async (): Promise<Element[]> => this.clipboardData;

  hasData = async (): Promise<boolean> => this.clipboardData.length > 0;
}
