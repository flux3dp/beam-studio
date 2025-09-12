import type { ISVGLayerConscrtuctor } from '@core/interfaces/ISVGLayer';

import type { ClipboardElement } from './Clipboard';

export default interface ISVGDrawing {
  browser: {
    isTouch: () => boolean;
  };
  copyElem: (elem: Element) => Element;
  copyElemData: (elem: ClipboardElement) => Element;
  draw: {
    Layer: ISVGLayerConscrtuctor;
  };
  releaseId: (id: string) => void;
}
