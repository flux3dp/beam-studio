import type { EventEmitter } from 'events';

import type { BaseHistoryCommand } from '@core/app/svgedit/history/history';
import type { IPathActions } from '@core/app/svgedit/operations/pathActions';
import type { SelectorManager } from '@core/app/svgedit/selector';
import type textActions from '@core/app/svgedit/text/textactions';
import type { Units } from '@core/helpers/units';
import type { IBatchCommand, ICommand, IUndoManager } from '@core/interfaces/IHistory';
import type IShapeStyle from '@core/interfaces/IShapeStyle';
import type ISVGConfig from '@core/interfaces/ISVGConfig';
import type ISVGDrawing from '@core/interfaces/ISVGDrawing';

export interface IPoint {
  x: number;
  y: number;
}

export interface IRect {
  height: number;
  width: number;
  x: number;
  y: number;
}

export default interface ISVGCanvas {
  addAlignEdges: (edges: Array<{ x1: number; x2: number; y1: number; y2: number }>) => void;
  addAlignPoint: (x: number, y: number) => void;
  addCommandToHistory: (command: ICommand) => void;
  addExtension: any;
  addSvgElementFromJson<T = SVGElement>(obj: { attr: any; curStyles?: boolean; element: string }): T;
  addToSelection: (elemsToAdd: SVGElement[], showGrips?: boolean, noCall?: boolean) => void;
  alignSelectedElements(
    type: 'b' | 'c' | 'l' | 'm' | 'r' | 't',
    relativeTo: 'largest' | 'page' | 'selected' | 'smallest',
  ): void;
  assignAttributes(element: Element, args: any): void;
  bind: (eventName: string, callback: ((win: any, elem: any) => void) | boolean) => void;
  calcElemFilledInfo: (elem: Element) => { isAllFilled: boolean; isAnyFilled: boolean };
  calcPathClosed: (elem: Element) => boolean;
  call: (eventName: string, args?: any | SVGElement[]) => void;
  changeSelectedAttribute(attr: string, val: number | string, elems?: Element[]): void;
  changeSelectedAttributeNoUndo: (attr: string, val: number | string, elems?: Element[]) => void;
  cleanupElement: (elem: SVGElement) => void;
  clear: () => void;
  clearAlignLines: () => void;
  clearBoundingBox: () => void;
  clearSelection: (noCall?: boolean) => void;
  collectAlignPoints: () => void;
  convertGradients: (elem: Element) => void;
  convertToNum(attr: string, val: number): number;
  convertToPath: (elem: SVGElement, isSubCmd?: boolean) => { cmd: BaseHistoryCommand; path: SVGPathElement };
  decomposePath: (elements?: SVGElement[]) => void;
  deleteSelectedElements: () => void;
  disassembleUse2Group: (
    elems?: SVGElement[],
    skipConfirm?: boolean,
    addToHistory?: boolean,
    showProgress?: boolean,
  ) => Promise<BaseHistoryCommand>;
  distHori: (isSubCmd?: boolean) => BaseHistoryCommand | void;
  distVert: (isSubCmd?: boolean) => BaseHistoryCommand | void;
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
  getCurrentResizeMode: () => string;
  getCurrentShape: () => IShapeStyle;
  getCurrentZoom: () => number; // New getter for current_zoom
  getDocumentTitle: () => string;
  getHref: (elem: SVGElement) => string;
  getId: () => string;
  getImageSource: () => Promise<Record<string, ArrayBuffer>>;
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
  getRotationAngle(elem: Element): number;
  getRubberBox: () => SVGRectElement;
  getSelectedElementsAlignPoints: () => IPoint[];
  getSelectedElems: (ungroupTempGroup?: boolean) => SVGElement[];
  getSelectedWithoutTempGroup: () => SVGElement[];
  getStarted: () => boolean;
  getStartTransform: () => any;
  getSvgString: (opts?: { fixTopExpansion?: boolean; unit?: Units }) => string;
  getTempGroup: () => SVGGElement;
  getTitle: () => string;
  getVisibleElementsAndBBoxes: (elems?: SVGElement[]) => Array<{ bbox: IRect; elem: Element }>;
  getZoom: () => number; // Old getter for current_zoom
  groupSelectedElements: (isSubCmd?: boolean) => void | { command: BaseHistoryCommand; group: SVGGElement };
  groupSvgElem: (elem: SVGElement) => void;
  handleGenerateSensorArea: (evt: MouseEvent) => void;
  isAutoAlign: boolean;
  isElemFillable: (elem: Element) => boolean;
  leaveContext: () => void;
  moveDownSelectedElement(): void;
  moveTopBottomSelected(direction: 'bottom' | 'top'): void;
  moveUpSelectedElement(): void;
  multiSelect(elements: SVGElement[]): void;
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
  setBlur(blurValue: number, shouldComplete: boolean): void;
  setBlurNoUndo(blurValue: number): void;
  setColor: (pickerType: string, color: string, preventUndo?: boolean) => void;
  setConfig(curConfig: ISVGConfig): void;
  setContentElem: (content: Element) => void;
  setContext(element: Element): void;
  setCurrentResizeMode: (mode: string) => void;
  setCurrentStyleProperties: (key: string, val: number | string) => void;
  setElemsFill: (elems: Element[]) => void;
  setElemsUnfill: (elems: Element[]) => void;
  setHref: (elem: SVGElement | SVGImageElement, href: string) => void;
  setLastClickPoint: (point: { x: number; y: number }) => void;
  setMode: (mode: string) => void;
  setOpacity: (opacity: number) => void;
  setPaintOpacity: (pickerType: string, opacity: number, preventUndo?: boolean) => void;
  setRootScreenMatrix: (matrix: SVGMatrix) => void;
  setRotationAngle: (val: number, preventUndo: boolean, elem?: SVGElement) => void;
  setStrokeAttr(attrKey: string, value: string): void;
  setStrokeWidth(width: number): void;
  setSvgElemPosition: (para: 'x' | 'y', val: number, elem?: SVGElement, addToHistory?: boolean) => IBatchCommand;
  setSvgElemSize: (type: 'height' | 'rx' | 'ry' | 'width', val: number, addToHistory?: boolean) => IBatchCommand | null;
  setSvgString: (content: string) => boolean;
  simplifyPath: (elements?: SVGAElement[]) => void;
  sortTempGroupByLayer: () => void;
  spaceKey: boolean;
  svgToString(elem: Element, indent: number, units?: Units): string;
  tempGroupSelectedElements: () => SVGElement[];
  textActions: typeof textActions;
  toggleAutoAlign: () => boolean;
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
}
