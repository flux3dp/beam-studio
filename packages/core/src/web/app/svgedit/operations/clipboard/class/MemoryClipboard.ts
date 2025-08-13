import { v4 as uuid } from 'uuid';

import type { ClipboardCore, ClipboardData } from '@core/interfaces/Clipboard';

import { Clipboard } from './Clipboard';

export class MemoryClipboard extends Clipboard implements ClipboardCore {
  private clipboardData: Element[] = [];
  private id: string = '';

  protected writeDataToClipboard = async (elems: Element[]): Promise<void> => {
    this.id = uuid();
    this.clipboardData = [...elems];
  };

  getRawData = async (): Promise<ClipboardData> =>
    // only provide id and source for paste check
    ({ id: this.id, source: 'web' }) as ClipboardData;

  getData = async (): Promise<Element[]> => this.clipboardData;

  hasData = async (): Promise<boolean> => this.clipboardData.length > 0;
}
