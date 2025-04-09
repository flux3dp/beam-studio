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
  createLayer: (name: string) => SVGGElement;
  draw: {
    Layer: ISVGLayerConscrtuctor;
  };
  getCurrentLayer: () => null | SVGGElement;
  getCurrentLayerName: () => null | string;
  getLayerByName: (layerName: string) => null | SVGGElement;
  getLayerColor: (layerName: string) => string;
  getLayerName: (index: number) => null | string;
  getLayerVisibility: (layerName: string) => boolean;
  getNumLayers: () => number;
  hasLayer: (layerName: string) => boolean;
  identifyLayers: () => void;
  layer_map: { [key: string]: ISVGLayer };
  releaseId: (id: string) => void;
  setCurrentLayer: (layerName: string) => boolean;
  setLayerOpacity: (name: string, opacity: number) => void;
}
