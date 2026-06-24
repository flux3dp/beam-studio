import { v4 } from 'uuid';

import type { ClipboardCore, ClipboardData } from '@core/interfaces/Clipboard';

import { Clipboard } from './Clipboard';

export class MemoryClipboard extends Clipboard implements ClipboardCore {
  private clipboardData: Element[] = [];
  private id: string = '';

  protected writeDataToClipboard = async (elems: Element[]): Promise<void> => {
    this.id = v4();
    this.clipboardData = [...elems];

    try {
      // flush the clipboard to avoid svg-editor.ts 'paste' event keeping reading the system clipboard data
      await navigator.clipboard.writeText(
        `Beam Studio Elements: ${[...elems].map((elem) => elem.outerHTML).join('\n')}`,
      );
    } catch (err) {
      console.error('Failed to write to clipboard:', err);
    }
  };

  getRawData = async (): Promise<ClipboardData | null> =>
    // only provide id and source for paste check
    this.clipboardData.length ? ({ id: this.id, source: 'web' } as ClipboardData) : null;

  getData = async (): Promise<Element[]> => this.clipboardData;

  hasData = async (): Promise<boolean> => this.clipboardData.length > 0;
}
