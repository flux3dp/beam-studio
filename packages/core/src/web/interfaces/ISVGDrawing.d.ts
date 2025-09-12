import type { ISVGLayerConscrtuctor } from '@core/interfaces/ISVGLayer';
import type ISVGLayer from '@core/interfaces/ISVGLayer';

import type { ClipboardElement } from './Clipboard';

export default interface ISVGDrawing {
  all_layers: ISVGLayer[];
  browser: {
    isTouch: () => boolean;
  };
  copyElem: (elem: Element) => Element;
  copyElemData: (elem: ClipboardElement) => Element;
  draw: {
    Layer: ISVGLayerConscrtuctor;
  };
  getCurrentLayer: () => null | SVGGElement;
  getLayerName: (index: number) => null | string;
  getNumLayers: () => number;
  hasLayer: (layerName: string) => boolean;
  layer_map: { [key: string]: ISVGLayer };
  releaseId: (id: string) => void;
}
