import type { ClipboardCore } from '@core/interfaces/Clipboard';

// TODO: decouple with svgcanvas
const { svgedit } = window;

export class BaseClipboardCore implements ClipboardCore {
  protected refClipboard: Record<string, Element> = {};

  addRefToClipboard = (useElement: SVGUseElement): void => {
    const symbolId = svgedit.utilities.getHref(useElement);
    const symbolElement = document.querySelector(symbolId);
    const originalSymbolElement =
      document.getElementById(symbolElement?.getAttribute('data-origin-symbol')) || symbolElement;

    if (originalSymbolElement) {
      this.refClipboard[symbolId] = originalSymbolElement;
    }
  };

  getRefFromClipboard = (id: string): Element | undefined => this.refClipboard[id];

  // eslint-disable-next-line ts/no-unused-vars
  protected writeDataToClipboard = async (elems: Element[]): Promise<void> => {
    throw new Error('Method not implemented.');
  };

  copyElements = async (elems: Element[]): Promise<void> => {
    const layerNames = new Set<string>();
    let layerCount = 0;

    this.refClipboard = {};

    for (let i = 0; i < elems.length; i += 1) {
      const elem = elems[i];
      const layerName = elem.closest('g.layer')?.querySelector('title')?.textContent;

      if (layerName) elem.setAttribute('data-origin-layer', layerName);

      if (elem.tagName === 'use') this.addRefToClipboard(elem as SVGUseElement);
      else Array.from(elem.querySelectorAll('use')).forEach((use: SVGUseElement) => this.addRefToClipboard(use));

      if (layerName && !layerNames.has(layerName)) {
        layerNames.add(layerName);
        layerCount += 1;
      }
    }

    // If there is only one layer selected, don't force user to paste on the same layer
    if (layerCount === 1) {
      elems.forEach((elem) => elem?.removeAttribute('data-origin-layer'));
    }

    await this.writeDataToClipboard(elems);
  };

  getData = async (): Promise<Element[]> => {
    throw new Error('Method not implemented.');
  };

  hasData = async (): Promise<boolean> => {
    return false;
  };
}

export default BaseClipboardCore;
