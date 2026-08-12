import type { StlObject } from '@core/app/stores/stlStore';
import { useStlStore } from '@core/app/stores/stlStore';
import { isStlProjection } from '@core/app/svgedit/stl/getters';
import { getHref } from '@core/app/svgedit/utils/href';
import type { ClipboardCore, ClipboardData } from '@core/interfaces/Clipboard';

export class Clipboard implements ClipboardCore {
  protected refClipboard: Record<string, Element> = {};

  /**
   * The meshes behind the copied projection rects, keyed by the id of the element `getData()`
   * hands back — the same role `refClipboard` plays for symbols.
   *
   * An STL object is a rect plus a mesh, and only the rect can be serialized: the mesh lives
   * outside the DOM and is far too large to put on the system clipboard. So the mesh is held here
   * instead, which also draws the boundary of what copy/paste can do — pasting into another tab
   * has no mesh to attach and is dropped rather than pasted as a broken object.
   */
  protected stlClipboard: Record<string, StlObject> = {};

  addRefToClipboard = (useElement: SVGUseElement): void => {
    const symbolId = getHref(useElement)!;
    const symbolElement = document.querySelector(symbolId);
    const originalSymbolElement =
      document.getElementById(symbolElement?.getAttribute('data-origin-symbol')!) || symbolElement;

    if (originalSymbolElement) {
      this.refClipboard[symbolId] = originalSymbolElement;
    }
  };

  getRefFromClipboard = (id: string): Element | undefined => this.refClipboard[id];

  addStlToClipboard = (elem: Element): void => {
    const object = useStlStore.getState().objects[elem.id];

    if (object) this.stlClipboard[elem.id] = object;
    else console.error(`STL projection rect ${elem.id} has no mesh in the store, it is not copied`);
  };

  getStlFromClipboard = (id: string): StlObject | undefined => this.stlClipboard[id];

  protected writeDataToClipboard = async (_elems: Element[]): Promise<void> => {
    throw new Error('Method not implemented.');
  };

  copyElements = async (elems: Element[]): Promise<void> => {
    const layerNames = new Set<string>();
    let layerCount = 0;

    this.refClipboard = {};
    this.stlClipboard = {};

    for (const elem of elems) {
      const layerName = elem.closest('g.layer')?.querySelector('title')?.textContent;

      if (layerName) elem.setAttribute('data-origin-layer', layerName);

      if (elem.tagName === 'use') this.addRefToClipboard(elem as SVGUseElement);
      else Array.from(elem.querySelectorAll('use')).forEach((use: SVGUseElement) => this.addRefToClipboard(use));

      if (isStlProjection(elem)) this.addStlToClipboard(elem);

      if (layerName && !layerNames.has(layerName)) {
        layerNames.add(layerName);
        layerCount++;
      }
    }

    // If there is only one layer selected, don't force user to paste on the same layer
    if (layerCount === 1) {
      elems.forEach((elem) => elem?.removeAttribute('data-origin-layer'));
    }

    await this.writeDataToClipboard(elems);
  };

  getRawData(): Promise<ClipboardData | null> {
    throw new Error('Method not implemented.');
  }

  getData = async (): Promise<Element[]> => {
    throw new Error('Method not implemented.');
  };

  hasData = async (): Promise<boolean> => false;
}
