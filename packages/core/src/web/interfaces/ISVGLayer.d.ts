export interface ISVGLayerConscrtuctor {
  new (name: string, group: null | SVGGElement, svgElem: Element, color: string): ISVGLayer;
}

declare class ISVGLayer {
  constructor(name: string, group: null | SVGGElement, svgElem: Element, color: string);

  group_: SVGGElement;

  name_: string;

  getGroup: () => SVGGElement;

  setColor: (color: string) => void;

  setFullColor: (val: boolean) => void;
}

export default ISVGLayer;
