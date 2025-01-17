import IShapeStyle from 'interfaces/IShapeStyle';
import ISVGConfig from 'interfaces/ISVGConfig';
import ISVGDrawing from 'interfaces/ISVGDrawing';
import { EventEmitter } from 'events';
import { IBatchCommand, ICommand, IUndoManager } from 'interfaces/IHistory';
import { ImportType } from 'interfaces/ImportSvg';
import { IPathActions } from 'app/svgedit/operations/pathActions';
import { SelectorManager } from 'app/svgedit/selector';
import { Units } from 'helpers/units';
import textActions from 'app/svgedit/text/textactions';
import { BaseHistoryCommand } from 'app/svgedit/history/history';

export interface IPoint {
  x: number;
  y: number;
}

interface IRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default interface ISVGCanvas {
  addAlignPoint: (x: number, y: number) => void;
  addCommandToHistory: (command: ICommand) => void;
  addedNew: boolean;
  addExtension: any;
  addSvgElementFromJson<T = SVGElement>(obj: {
    element: string;
    curStyles?: boolean;
    attr: any;
  }): T;
  addToSelection: (elemsToAdd: SVGElement[], showGrips?: boolean, noCall?: boolean) => void;
  alignSelectedElements(
    type: 'l' | 'c' | 'r' | 't' | 'm' | 'b',
    relativeTo: 'selected' | 'largest' | 'smallest' | 'page'
  ): void;
  assignAttributes(element: HTMLElement, args: any): void;
  bind: (eventName: string, callback: boolean | ((win: any, elem: any) => void)) => void;
  calculateTransformedBBox(elem: Element): IRect;
  call: (eventName: string, args?: SVGElement[] | any) => void;
  changeSelectedAttribute(attr: string, val: string | number): void;
  changeSelectedAttributeNoUndo: (attr: string, val: string | number, elems: Element[]) => void;
  cleanupElement: (elem: SVGElement) => void;
  clear: () => void;
  clearBoundingBox: () => void;
  clearSelection: (noCall?: boolean) => void;
  convertToNum(attr: string, val: number): number;
  deleteSelectedElements: () => void;
  drawAlignLine: (x: number, y: number, xMatchPoint: IPoint, yMatchPoint: IPoint) => void;
  drawing: ISVGDrawing;
  embedImage(url: string, callback?: (dataURI: string) => void): void;
  events: EventEmitter;
  findMatchPoint: (x: number, y: number) => { xMatchPoint: IPoint; yMatchPoint: IPoint };
  getVisibleElementsAndBBoxes: (elems?: SVGElement[]) => { elem: Element; bbox: IRect }[];
  getColor: (key: string) => string;
  getContentElem: () => SVGGElement;
  setContentElem: (content: Element) => void;
  getContainer: () => SVGElement;
  getCurrentConfig: () => ISVGConfig;
  getCurrentDrawing: () => ISVGDrawing;
  resetCurrentDrawing: (content?: Element) => void;
  getCurrentGroup: () => SVGGElement;
  getCurrentMode: () => string;
  getCurrentResizeMode: () => string;
  getCurrentShape: () => IShapeStyle;
  getCurrentZoom: () => number; // New getter for current_zoom
  getDocumentTitle: () => string;
  getGoodImage: () => string;
  getHref: (elem: SVGElement) => string;
  getId: () => string;
  getIntersectionList: () => SVGElement[];
  getMode: () => string;
  getMouseTarget: (evt: MouseEvent, allowTempGroup?: boolean) => SVGElement;
  getNextId: () => string;
  getPaintOpacity: (pickerType: string) => number;
  getRefElem(refString: string): Element;
  getRoot: () => SVGSVGElement;
  getRootScreenMatrix: () => SVGMatrix;
  /**
   * @deprecated use svgedit/transfrom/rotation.ts#getRotationAngle instead
   */
  getRotationAngle(elem: Element): void;
  getRubberBox: () => SVGRectElement;
  getSelectedElems: (ungroupTempGroup?: boolean) => SVGElement[];
  getStarted: () => boolean;
  getStartTransform: () => any;
  getStrokedBBox(elems: Element[]): IRect;
  getSvgRealLocation: (elem: SVGElement) => IRect;
  removeUnusedDefs: () => void;
  getSvgString: (opts?: { unit?: Units }) => string;
  getTempGroup: () => SVGGElement;
  getTitle: () => string;
  getZoom: () => number; // Old getter for current_zoom
  groupSelectedElements: (isSubCmd?: boolean) => BaseHistoryCommand | void;
  handleGenerateSensorArea: (evt: MouseEvent) => void;
  prepareSvg: (newDoc: Document) => void;
  importSvgString(
    xmlString: string,
    args: {
      type?: ImportType;
      layerName?: string;
      parentCmd?: IBatchCommand;
      targetModule?: number;
    }
  ): Promise<SVGUseElement>;
  isBezierPathAlignToEdge: boolean;
  isUsingLayerColor: boolean;
  leaveContext: () => void;
  mergeLayer: () => void;
  mergeAllLayers: () => void;
  moveDownSelectedElement(): void;
  moveTopBottomSelected(direction: 'top' | 'bottom'): void;
  moveUpSelectedElement(): void;
  opacityAnimation: SVGAnimateElement;
  open: () => void;
  pathActions: IPathActions;
  pushGroupProperties: (g: SVGGElement, undoable: boolean) => IBatchCommand;
  randomizeIds(enableRandomization: boolean): string;
  ready: (arg0: () => void) => any;
  recalculateAllSelectedDimensions: (isSubCommand?: boolean) => IBatchCommand;
  removeFromSelection: (elems: SVGElement[]) => void;
  removeFromTempGroup: (elem: SVGElement) => void;
  renameCurrentLayer: (layerName: string) => void;
  reorientGrads: (elem: SVGElement, matrix: SVGMatrix) => void;
  resetOrientation: (elem: SVGElement) => void;
  runExtensions: (eventName: string, args?: any, returnArray?: boolean) => any;
  selectAll: () => void;
  selectOnly: (elems: SVGElement[], showGrips?: boolean) => void;
  selectorManager: SelectorManager;
  sensorAreaInfo: { x: number; y: number; dx: number; dy: number; elem: SVGElement };
  setBackground: (color: string, url: string) => void;
  setBlur(blurValue: number, shouldComplete: boolean): void;
  setBlurNoUndo(blurValue: number): void;
  setColor: (pickerType: string, color: string, preventUndo?: boolean) => void;
  setConfig(curConfig: ISVGConfig): void;
  setContext(element: Element): void;
  setCurrentLayer: (layerName: string) => boolean;
  setCurrentResizeMode: (mode: string) => void;
  setCurrentStyleProperties: (key: string, val: string | number) => void;
  setHref: (elem: SVGImageElement | SVGElement, href: string) => void;
  setImageURL: (url: string) => void;
  setLastClickPoint: (point: { x: number; y: number }) => void;
  setLayerVisibility(
    layerName: string,
    visible: boolean,
    opts?: { parentCmd?: IBatchCommand; addToHistory?: boolean }
  ): void;
  setMode: (mode: string) => void;
  setOpacity: (opacity: number) => void;
  setPaintOpacity: (pickerType: string, opacity: number, preventUndo?: boolean) => void;
  setRootScreenMatrix: (matrix: SVGMatrix) => void;
  setRotationAngle: (val: number, preventUndo: boolean, elem?: SVGElement) => void;
  setStrokeAttr(attrKey: string, value: string): void;
  setStrokeWidth(width: number): void;
  setSvgElemSize: (
    type: 'width' | 'height' | 'rx' | 'ry',
    val: number,
    addToHistory?: boolean
  ) => IBatchCommand | null;
  setSvgString: (content: string) => boolean;
  setUiStrings(allStrings: Record<string, string>): void;
  sortTempGroupByLayer: () => void;
  spaceKey: boolean;
  svgToString(elem: Element, indent: number, units?: Units): string;
  tempGroupSelectedElements: () => SVGElement[];
  textActions: typeof textActions;
  ungroupTempGroup(elem?: SVGElement): SVGElement[];
  undoMgr: IUndoManager;
  ungroupSelectedElement(): void;
  updateElementColor: (elem: Element) => void;
  updateRecentFiles(path: string): void;
  unsafeAccess: {
    setCurrentMode: (v: string) => void;
    setRubberBox: (v: SVGRectElement) => void;
    setStarted: (v: boolean) => void;
    setSelectedElements: (elems: SVGElement[]) => void;
    setStartTransform: (transform: any) => void;
  };
  uniquifyElems: (elem: SVGElement) => void;
  groupSvgElem: (elem: SVGElement) => void;
  convertGradients: (elem: Element) => void;
  identifyLayers: () => void;
  disassembleUse2Group: (
    elems: Array<SVGElement>,
    skipConfirm?: boolean,
    addToHistory?: boolean,
    showProgress?: boolean
  ) => Promise<BaseHistoryCommand>;
  zoomSvgElem: (zoom: number) => void;
  convertToPath: (
    elem: SVGElement,
    isSubCmd?: boolean
  ) => { path: SVGPathElement; cmd: BaseHistoryCommand };
}
