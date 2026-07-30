import { create } from 'zustand';
import { combine } from 'zustand/middleware';

import type { PaperSelection, PrintAndCutStep } from './constants';
import { printAndCutSteps } from './constants';
import type { ResumeConfig } from './resumeConfigStore';
import type { AlignProgress } from './utils/alignProgress';
import type { CanvasContents } from './utils/collectContents';
import type { MarkPosition } from './utils/layout';
import { computeFullBBox, computeMarks } from './utils/layout';
import type { PrintingContentsElementSnapshot, PrintingContentsMatch } from './utils/printingContentsSnapshot';

export interface BBox {
  height: number;
  width: number;
  x: number;
  y: number;
}

/** Rigid transform mapping designed positions onto the printed sheet: p' = R(angle)·p + (tx, ty) */
export interface AlignmentTransform {
  /** radians, counterclockwise in svg coordinates */
  angle: number;
  tx: number;
  ty: number;
}

/** State produced by the camera capture in the align step */
interface AlignState {
  /** Rigid transform fitted to the detected marks in the align step; null until detected */
  alignmentTransform: AlignmentTransform | null;
  /** Progress of the align step's camera flow; null while it is not running */
  alignProgress: AlignProgress | null;
  /** Camera preview image of the workarea captured in the align step */
  cameraImageUrl: null | string;
  /** Whether the align step's capture + align flow is running; blocks navigation */
  isProcessing: boolean;
}

export type ContourSource = 'layer' | 'outline';

/** The contour (cut geometry) configuration, frozen into the saved config on Finish */
export interface ContourState {
  /**
   * Serialized layer-mode contour geometry: captured at Finish so a resumed run
   * cuts what was printed even if the source layer changed since, and restored
   * from the saved config on resume. Null on fresh runs (the live layer is read
   * and frozen at Finish) and in outline mode, where contourPathD is the frozen
   * geometry.
   */
  contourElements: null | string[];
  /** Name of the layer used as the contour when contourSource is 'layer' */
  contourLayerName: null | string;
  /** Traced outline path `d` in canvas coordinates; null in layer mode and before the first trace */
  contourPathD: null | string;
  contourSource: ContourSource;
}

/**
 * Everything that defines the printed sheet's setup — contour, grid, paper and
 * the printing-contents snapshots. Shared verbatim between the dialog state and
 * the persisted ResumeConfig, so a saved config can be spread straight
 * into the store on resume.
 */
export interface SheetSetupState extends ContourState {
  /** Number of grid copies horizontally */
  gridColumns: number;
  /** Gap between grid copies, in mm */
  gridGapMm: number;
  /** Number of grid copies vertically */
  gridRows: number;
  markPositions: MarkPosition[];
  /** Offset distance of the generated contour, in mm */
  offsetDistance: number;
  orientation: 'landscape' | 'portrait';
  paperKey: PaperSelection;
  /**
   * Printing contents snapshots, compared on resume: unchanged contents can be
   * shown on the canvas, otherwise only the contour path and marks are drawn.
   * Snapshots (rather than a serialized copy of the contents) because the full
   * SVG string is not stored, so change detection is the only option.
   */
  printingContentsElements: null | PrintingContentsElementSnapshot[];
}

/** Printing contents, grid, paper and contour configuration edited on the canvas */
interface CanvasState extends SheetSetupState {
  /**
   * Box the printed sheet is laid out around (marks, grid pitch, paper): the
   * contour's extent — see computeFullBBox; null until a design is collected
   */
  fullBBox: BBox | null;
  /**
   * True when the printing contents no longer match the saved snapshot, so the printed
   * sheet cannot be previewed and only the frozen cut path is shown
   */
  isPrintingContentsChanged: boolean;
  /** True when the dialog was opened on the resume screen from a saved config */
  isResume: boolean;
  /** Bounding box of the collected printing contents (the artwork), in canvas units (px) */
  printingContentsBBox: BBox | null;
  /**
   * Ids of the elements the resume preview may render, matched against the
   * saved snapshot; null keeps the whole live contents (fresh runs and configs
   * saved before snapshots existed)
   */
  printingContentsElementIds: null | string[];
  /** 'resume' is a virtual entry step outside the linear printAndCutSteps flow */
  step: 'resume' | PrintAndCutStep;
}

type State = AlignState & CanvasState;

const initialState: State = {
  alignmentTransform: null,
  alignProgress: null,
  cameraImageUrl: null,
  contourElements: null,
  contourLayerName: null,
  contourPathD: null,
  contourSource: 'outline',
  fullBBox: null,
  gridColumns: 1,
  gridGapMm: 10,
  gridRows: 1,
  isPrintingContentsChanged: false,
  isProcessing: false,
  isResume: false,
  markPositions: [],
  offsetDistance: 2,
  orientation: 'portrait',
  paperKey: 'fit',
  printingContentsBBox: null,
  printingContentsElementIds: null,
  printingContentsElements: null,
  step: 'setup',
};

export const usePrintAndCutStore = create(
  combine(initialState, (set, get) => ({
    init: (contents: CanvasContents): void => {
      set({
        ...initialState,
        // the flow starts in outline mode, where the full box is the contents box
        fullBBox: contents.printingContentsBBox,
        markPositions: computeMarks({ ...initialState, fullBBox: contents.printingContentsBBox }),
        printingContentsBBox: contents.printingContentsBBox,
        printingContentsElements: contents.printingContentsElements,
      });
    },
    /** Enter the flow on the resume screen from a previously saved configuration */
    initFromConfig: (config: ResumeConfig, designMatch: PrintingContentsMatch): void => {
      set({
        ...initialState,
        ...config,
        // the saved box already accounts for the cut layer: a resumed run keeps
        // the layout the printed sheets were made with, it never recomputes it
        fullBBox: config.fullBBox,
        isPrintingContentsChanged: designMatch.isPrintingContentsChanged,
        isResume: true,
        // spread explicitly: a config saved before snapshots existed has no
        // printingContentsElements field, which would otherwise land in state as undefined
        printingContentsElementIds: designMatch.printingContentsElementIds,
        printingContentsElements: config.printingContentsElements ?? null,
        step: 'resume',
      });
    },
    nextStep: (): void => {
      const { step } = get();
      const index = printAndCutSteps.indexOf(step);

      if (index < printAndCutSteps.length - 1) set({ step: printAndCutSteps[index + 1] });
    },
    prevStep: (): void => {
      const { step } = get();
      const index = printAndCutSteps.indexOf(step);

      if (index > 0) set({ step: printAndCutSteps[index - 1] });
    },
    reset: (): void => set(initialState),
    setAlignmentTransform: (alignmentTransform: AlignmentTransform | null): void => set({ alignmentTransform }),
    setAlignProgress: (alignProgress: AlignProgress | null): void =>
      set((state) => ({
        // the flow can revisit an earlier phase (a refuted mark hypothesis
        // resumes the sweep), so the bar only ever moves forward while the
        // message keeps describing exactly what the camera is doing
        alignProgress: alignProgress && {
          ...alignProgress,
          percentage: Math.max(state.alignProgress?.percentage ?? 0, alignProgress.percentage),
        },
      })),
    setCameraImageUrl: (cameraImageUrl: null | string): void => set({ cameraImageUrl }),
    setContourLayerName: (contourLayerName: null | string): void =>
      set((state) => withFullBBox(state, { contourLayerName })),
    setContourPathD: (contourPathD: null | string): void => set((state) => withFullBBox(state, { contourPathD })),
    setContourSource: (contourSource: ContourSource): void => set((state) => withFullBBox(state, { contourSource })),
    setGrid: (grid: Partial<Pick<State, 'gridColumns' | 'gridGapMm' | 'gridRows'>>): void =>
      set((state) => withFullBBox(state, grid)),
    setIsProcessing: (isProcessing: boolean): void => set({ isProcessing }),
    // the marks do not move with the distance itself: they follow the re-traced
    // path, which arrives through setContourPathD
    setOffsetDistance: (offsetDistance: number): void => set({ offsetDistance }),
    setOrientation: (orientation: 'landscape' | 'portrait'): void => set({ orientation }),
    setPaperKey: (paperKey: PaperSelection): void => set({ paperKey }),
    setStep: (step: 'resume' | PrintAndCutStep): void => set({ step }),
  })),
);

/**
 * The patch plus the full box and marks recomputed from the patched state:
 * every change to what gets cut (source, layer, traced path) or how it is
 * arranged (grid) moves the sheet layout, and the marks always follow it. The
 * previous marks are kept while there is no layout to place them around.
 */
const withFullBBox = (state: State, patch: Partial<CanvasState>): Partial<CanvasState> => {
  const fullBBox = computeFullBBox({ ...state, ...patch });
  const marks = computeMarks({ ...state, ...patch, fullBBox });

  return { ...patch, fullBBox, markPositions: marks.length > 0 ? marks : state.markPositions };
};
