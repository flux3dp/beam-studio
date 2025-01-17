declare global {
  interface Window {
    FLUX: {
      version: string;
      dev: boolean;
    };
    svgedit: {
      NS: { [key: string]: string };
      browser: {
        isChrome: () => boolean;
        isGecko: () => boolean;
        isIE: () => boolean;
        isMac: () => boolean;
        isOpera: () => boolean;
        isTouch: () => boolean;
        isWebkit: () => boolean;
        isWindows: () => boolean;
        supportsEditableText: () => () => boolean;
        supportsGoodDecimals: () => () => boolean;
        supportsGoodTextCharPos: () => boolean;
        supportsHVLineContainerBBox: () => () => boolean;
        supportsNativeTransformLists: () => () => boolean;
        supportsNonScalingStroke: () => () => boolean;
        supportsPathBBox: () => () => boolean;
        supportsPathInsertItemBefore: () => () => boolean;
        supportsPathReplaceItem: () => () => boolean;
        supportsSelectors: () => () => boolean;
        supportsSvg: () => () => boolean;
        supportsXpath: () => () => boolean;
      },
      draw: {
        Drawing: (svgElem: SVGSVGElement, opt_idPrefix: string) => any;
        Layer: (
          name: string,
          group: SVGGElement | null,
          svgElem: SVGGElement,
          color: string,
        ) => any;
        randomizeIds: (enableRandomization: string, currentDrawing: any) => void;
      },
      getReverseNS: () => { [key: string]: string };
      history: {
        BatchCommand: (text?: string) => any;
        ChangeElementCommand: (elem: Element, attrs: any, text?: string) => any;
        HistoryEventTypes: { [key: string]: string };
        HistoryRecordingService: (undoManager: any) => any;
        InsertElementCommand: (elem: Element, text?: string) => any;
        MoveElementCommand: (
          elem: Element,
          oldNextSibling: Element,
          oldParent: Element,
          text?: string,
        ) => any;
        RemoveElementCommand: (
          elem: Element,
          oldNextSibling: Element,
          oldParent: Element,
          text?: string,
        ) => any;
        UndoManager: (historyEventHandler: any) => any;
      },
      math: {
        getMatrix: (elem: Element) => SVGMatrix;
        hasMatrixTransform: (tlist: any) => boolean;
        isIdentity: (m: SVGMatrix) => boolean;
        matrixMultiply: (...matr: SVGMatrix[]) => SVGMatrix;
        rectsIntersect: (r1: SVGRect, r2: SVGRect) => boolean;
        roundToDefault: (val: number) => number;
        roundToDigit: (val: number, digit?: number) => number;
        snapToAngle: (x1: number, y1: number, x2: number, y2: number) => {
          x: number;
          y: number;
          a: number;
        };
        transformBox: (l: number, t: number, w: number, h: number, m: SVGMatrix) => {
          tl: {
            x: number;
            y: number;
          },
          tr: {
            x: number;
            y: number;
          },
          bl: {
            x: number;
            y: number;
          },
          br: {
            x: number;
            y: number;
          },
          aabox: {
            x: number;
            y: number;
            width: number;
            height: number;
          },
        };
        transformListToTransform: (tlist: any, min?: number, max?: number) => any;
        transformPoint: (x: number, y: number, m: SVGMatrix) => {
          x: number,
          y: number,
        };
      },
      path: {
        Path: (elem: Element) => any;
        Segment: (index: number, item: any) => any;
        addDrawingCtrlGrip: (id: number) => HTMLElement;
        addDrawingPoint: (
          index: number,
          x: number,
          y: number,
          canvasX: number,
          canvasY: number,
        ) => HTMLElement;
        clearData: () => void;
        getCtrlLine: (id: number) => HTMLElement;
        getGripContainer: () => HTMLElement;
        getGripPosition: (x: number, y: number) => {
          x: number,
          y: number,
        };
        getGripPt: (seg: any, alt_pt: any) => {
          x: number,
          y: number,
        };
        getPath_: (elem: Element) => any;
        getPointFromGrip: (pt: any, path: any) => {
          x: number,
          y: number,
        };
        getSegSelector: (seg: any, update: any) => HTMLElement;
        init: (editorContext: any) => void;
        insertItemBefore: (elem: any, newseg: any, index: number) => void;
        path: any;
        ptObjToArr: (type: string, seg_item: []) => [];
        recalcRotatedPath: () => void;
        removePath_: (id: number) => {
          x: number,
          y: number,
        };
        replacePathSeg: (type: string, index: number, pts: any, elem: any) => any;
        setLinkControlPoints: (lcp: any) => void;
        smoothControlPoints: (
          ct1: {
            x: number,
            y: number,
          },
          ct2: {
            x: number,
            y: number,
          },
          pt: {
            x: number,
            y: number,
          },
        ) => [{
          x: number,
          y: number,
        }, {
          x: number,
          y: number,
        }] | undefined;
        updateControlLines: () => void;
        updateDrawingPoints: () => void;
      };
      sanitize: {
        sanitizeSvg: (node: HTMLElement) => void;
      };
      select: {
        Selector: (id: number, elem: HTMLElement, bbox?: any) => any;
        SelectorManager: () => any;
        getSelectorManager: () => any;
        init: (config: any, svgFactory: any) => void;
      };
      coords: {
        init: any;
        remapElement: any;
      },
      recalculate: {
        init: any;
        recalculateDimensions: any;
        updateClipPath: any;
      },
      transformlist: any;
      units: any;
      utilities: any;
    };
    Jimp: any;
  }
}
