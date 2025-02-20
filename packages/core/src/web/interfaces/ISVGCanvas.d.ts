import type { EventEmitter } from 'events';

import type { BaseHistoryCommand } from '@core/app/svgedit/history/history';
import type { IPathActions } from '@core/app/svgedit/operations/pathActions';
import type { SelectorManager } from '@core/app/svgedit/selector';
import type textActions from '@core/app/svgedit/text/textactions';
import type { Units } from '@core/helpers/units';
import type { IBatchCommand, ICommand, IUndoManager } from '@core/interfaces/IHistory';
import type { ImportType } from '@core/interfaces/ImportSvg';
import type IShapeStyle from '@core/interfaces/IShapeStyle';
import type ISVGConfig from '@core/interfaces/ISVGConfig';
import type ISVGDrawing from '@core/interfaces/ISVGDrawing';

export interface IPoint {
  x: number;
  y: number;
}

interface IRect {
  height: number;
  width: number;
  x: number;
  y: number;
}

export default interface ISVGCanvas {
  addAlignEdges: (edges: Array<{ x1: number; x2: number; y1: number; y2: number }>) => void;
  addAlignPoint: (x: number, y: number) => void;
  addCommandToHistory: (command: ICommand) => void;
  addedNew: boolean;
  addExtension: any;
  addSvgElementFromJson<T = SVGElement>(obj: { attr: any; curStyles?: boolean; element: string }): T;
  addToSelection: (elemsToAdd: SVGElement[], showGrips?: boolean, noCall?: boolean) => void;
  alignSelectedElements(
    type: 'b' | 'c' | 'l' | 'm' | 'r' | 't',
    relativeTo: 'largest' | 'page' | 'selected' | 'smallest',
  ): void;
  assignAttributes(element: HTMLElement, args: any): void;
  bind: (eventName: string, callback: ((win: any, elem: any) => void) | boolean) => void;
  calculateTransformedBBox(elem: Element): IRect;
  call: (eventName: string, args?: any | SVGElement[]) => void;
  changeSelectedAttribute(attr: string, val: number | string): void;
  changeSelectedAttributeNoUndo: (attr: string, val: number | string, elems: Element[]) => void;
  cleanupElement: (elem: SVGElement) => void;
  clear: () => void;
  clearAlignLines: () => void;
  clearBoundingBox: () => void;
  clearSelection: (noCall?: boolean) => void;
  collectAlignPoints: () => void;
  convertGradients: (elem: Element) => void;
  convertToNum(attr: string, val: number): number;
  convertToPath: (elem: SVGElement, isSubCmd?: boolean) => { cmd: BaseHistoryCommand; path: SVGPathElement };
  deleteSelectedElements: () => void;
  disassembleUse2Group: (
    elems: SVGElement[],
    skipConfirm?: boolean,
    addToHistory?: boolean,
    showProgress?: boolean,
  ) => Promise<BaseHistoryCommand>;
  drawAlignLine: (tx: number, ty: number, x: IPoint | null, y: IPoint | null, index?: number) => void;
  drawing: ISVGDrawing;
  embedImage(url: string, callback?: (dataURI: string) => void): void;
  events: EventEmitter;
  findMatchedAlignPoints: (x: number, y: number) => Record<'farthest' | 'nearest', Record<'x' | 'y', IPoint | null>>;
  getColor: (key: string) => string;
  getContainer: () => SVGElement;
  getContentElem: () => SVGGElement;
  getCurrentConfig: () => ISVGConfig;
  getCurrentDrawing: () => ISVGDrawing;
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
  getSelectedElementsAlignPoints: () => IPoint[];
  getSelectedElems: (ungroupTempGroup?: boolean) => SVGElement[];
  getStarted: () => boolean;
  getStartTransform: () => any;
  getStrokedBBox(elems: Element[]): IRect;
  getSvgRealLocation: (elem: SVGElement) => IRect;
  getSvgString: (opts?: { unit?: Units }) => string;
  getTempGroup: () => SVGGElement;
  getTitle: () => string;
  getVisibleElementsAndBBoxes: (elems?: SVGElement[]) => Array<{ bbox: IRect; elem: Element }>;
  getZoom: () => number; // Old getter for current_zoom
  groupSelectedElements: (isSubCmd?: boolean) => BaseHistoryCommand | void;
  groupSvgElem: (elem: SVGElement) => void;
  handleGenerateSensorArea: (evt: MouseEvent) => void;
  identifyLayers: () => void;
  importSvgString(
    xmlString: string,
    args: {
      layerName?: string;
      parentCmd?: IBatchCommand;
      targetModule?: number;
      type?: ImportType;
    },
  ): Promise<SVGUseElement>;
  isBezierPathAlignToEdge: boolean;
  isUsingLayerColor: boolean;
  leaveContext: () => void;
  mergeAllLayers: () => void;
  mergeLayer: () => void;
  moveDownSelectedElement(): void;
  moveTopBottomSelected(direction: 'bottom' | 'top'): void;
  moveUpSelectedElement(): void;
  opacityAnimation: SVGAnimateElement;
  open: () => void;
  pathActions: IPathActions;
  prepareSvg: (newDoc: Document) => void;
  pushGroupProperties: (g: SVGGElement, undoable: boolean) => IBatchCommand;
  randomizeIds(enableRandomization: boolean): string;
  ready: (arg0: () => void) => any;
  recalculateAllSelectedDimensions: (isSubCommand?: boolean) => IBatchCommand;
  removeAlignEdges: (n: number) => void;
  removeFromSelection: (elems: SVGElement[]) => void;
  removeFromTempGroup: (elem: SVGElement) => void;
  removeUnusedDefs: () => void;
  renameCurrentLayer: (layerName: string) => void;
  reorientGrads: (elem: SVGElement, matrix: SVGMatrix) => void;
  resetCurrentDrawing: (content?: Element) => void;
  resetOrientation: (elem: SVGElement) => void;
  runExtensions: (eventName: string, args?: any, returnArray?: boolean) => any;
  selectAll: () => void;
  selectOnly: (elems: SVGElement[], showGrips?: boolean) => void;
  selectorManager: SelectorManager;
  sensorAreaInfo: { dx: number; dy: number; elem: SVGElement; x: number; y: number };
  setBackground: (color: string, url: string) => void;
  setBlur(blurValue: number, shouldComplete: boolean): void;
  setBlurNoUndo(blurValue: number): void;
  setColor: (pickerType: string, color: string, preventUndo?: boolean) => void;
  setConfig(curConfig: ISVGConfig): void;
  setContentElem: (content: Element) => void;
  setContext(element: Element): void;
  setCurrentLayer: (layerName: string) => boolean;
  setCurrentResizeMode: (mode: string) => void;
  setCurrentStyleProperties: (key: string, val: number | string) => void;
  setHref: (elem: SVGElement | SVGImageElement, href: string) => void;
  setImageURL: (url: string) => void;
  setLastClickPoint: (point: { x: number; y: number }) => void;
  setLayerVisibility(
    layerName: string,
    visible: boolean,
    opts?: { addToHistory?: boolean; parentCmd?: IBatchCommand },
  ): void;
  setMode: (mode: string) => void;
  setOpacity: (opacity: number) => void;
  setPaintOpacity: (pickerType: string, opacity: number, preventUndo?: boolean) => void;
  setRootScreenMatrix: (matrix: SVGMatrix) => void;
  setRotationAngle: (val: number, preventUndo: boolean, elem?: SVGElement) => void;
  setStrokeAttr(attrKey: string, value: string): void;
  setStrokeWidth(width: number): void;
  setSvgElemSize: (type: 'height' | 'rx' | 'ry' | 'width', val: number, addToHistory?: boolean) => IBatchCommand | null;
  setSvgString: (content: string) => boolean;
  setUiStrings(allStrings: Record<string, string>): void;
  sortTempGroupByLayer: () => void;
  spaceKey: boolean;
  svgToString(elem: Element, indent: number, units?: Units): string;
  tempGroupSelectedElements: () => SVGElement[];
  textActions: typeof textActions;
  undoMgr: IUndoManager;
  ungroupSelectedElement(): void;
  ungroupTempGroup(elem?: SVGElement): SVGElement[];
  uniquifyElems: (elem: SVGElement) => void;
  unsafeAccess: {
    setCurrentMode: (v: string) => void;
    setRubberBox: (v: SVGRectElement) => void;
    setSelectedElements: (elems: SVGElement[]) => void;
    setStarted: (v: boolean) => void;
    setStartTransform: (transform: any) => void;
  };
  updateElementColor: (elem: Element) => void;
  updateRecentFiles(path: string): void;
  zoomSvgElem: (zoom: number) => void;
}
