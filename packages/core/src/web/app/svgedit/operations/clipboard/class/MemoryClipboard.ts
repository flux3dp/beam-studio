import type { ClipboardCore, ClipboardData } from '@core/interfaces/Clipboard';

import { Clipboard } from './Clipboard';

export class MemoryClipboard extends Clipboard implements ClipboardCore {
  private clipboardData: Element[] = [];

  protected writeDataToClipboard = async (elems: Element[]): Promise<void> => {
    this.clipboardData = [...elems];
  };

  getRawData = async (): Promise<ClipboardData> =>
    // only provide outerHTMLs and source for paste signature check
    ({
      outerHTMLs: this.clipboardData.map((elem) => elem.outerHTML),
      source: 'web',
    }) as ClipboardData;

  getData = async (): Promise<Element[]> => this.clipboardData;

  hasData = async (): Promise<boolean> => this.clipboardData.length > 0;
}
