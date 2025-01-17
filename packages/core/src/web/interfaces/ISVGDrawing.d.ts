import ISVGLayer, { ISVGLayerConscrtuctor } from 'interfaces/ISVGLayer';

export default interface ISVGDrawing {
  all_layers: ISVGLayer[];
  copyElem: (elem: Element) => Element;
  getCurrentLayer: () => SVGGElement | null;
  setCurrentLayer: (layerName: string) => boolean;
  getCurrentLayerName: () => string | null;
  getLayerVisibility: (layerName: string) => boolean;
  getLayerColor: (layerName: string) => string;
  getLayerName: (index: number) => string | null;
  hasLayer: (layerName: string) => boolean;
  createLayer: (name: string) => SVGGElement;
  layer_map: { [key: string]: ISVGLayer };
  getLayerByName: (layerName: string) => SVGGElement | null;
  getNumLayers: () => number;
  identifyLayers: () => void;
  setLayerOpacity: (name: string, opacity: number) => void;
  releaseId: (id: string) => void;
  draw: {
    Layer: ISVGLayerConscrtuctor;
  };
  browser: {
    isTouch: () => boolean;
  };
}
