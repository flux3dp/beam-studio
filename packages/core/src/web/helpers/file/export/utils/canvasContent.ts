import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { Units } from '@core/helpers/units';
import type { IDeviceInfo } from '@core/interfaces/IDevice';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { switchSymbolWrapper } from './common';
import { checkNounProjectElements, removeNPElementsWrapper } from './nounProject';

/*
 * Every step below is loaded on demand rather than imported at the top.
 *
 * This module is the one place that knows about all of them, so importing them statically would
 * make anything that touches an export preset pull in the whole set — paper.js, the font stack, the
 * layer manager — whether its target uses them or not. That reached far enough to start killing
 * jest workers, and in the app it meant a save dialog loading the task-code machinery. A target now
 * costs what it declares and nothing else.
 */
const load = {
  annotateCurveEngravingZSpeed: () => import('@core/app/actions/beambox/export/annotateCurveEngravingZSpeed'),
  annotateLayerBBox: () => import('@core/app/actions/beambox/export/annotateLayerBBox'),
  annotateLayerDpmm: () => import('@core/app/actions/beambox/export/annotateLayerDpmm'),
  annotatePrintingColor: () => import('@core/helpers/layer/annotatePrintingColor'),
  convertAllTextToPath: () => import('@core/helpers/path/convertToPath'),
  convertBitmapToInfilledRect: () => import('@core/helpers/layer/convertBitmapToInfilledRect'),
  convertClipPath: () => import('@core/helpers/layer/convertClipPath'),
  convertShapeToBitmap: () => import('@core/helpers/layer/convertShapeToBitmap'),
  convertVariableText: () => import('@core/helpers/variableText'),
  generateThumbnail: () => import('@core/app/actions/beambox/export/generate-thumbnail'),
  layerConfig: () => import('@core/helpers/layer/layer-config-helper'),
  layerManager: () => import('@core/app/svgedit/layer/layerManager'),
  layersToA4Base64: () => import('@core/helpers/layer/layersToA4Base64'),
  selectionManager: () => import('@core/app/svgedit/selection'),
  splitFullColorLayer: () => import('@core/helpers/layer/full-color/splitFullColorLayer'),
  updateImagesResolution: () => import('@core/helpers/image/updateImagesResolution'),
  webFontFaceCss: () => import('@core/helpers/image/webFontFaceCss'),
};

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

export type CanvasContentOptions = {
  /**
   * Annotations the backend reads off the layers. Applied after the thumbnail is taken: they say
   * how to cut the drawing, not what it looks like.
   */
  annotate?: {
    curveZSpeed?: boolean;
    layerBBox?: boolean;
    /** Note: this one has no revert, matching the behaviour it has always had. */
    layerDpmm?: boolean;
    printingColor?: boolean;
    splitFullColor?: boolean;
  };
  /** Extra artifacts to take while the canvas is prepared. */
  capture?: {
    /** The preview the machine shows while running the task. */
    thumbnail?: boolean;
  };
  /** Interactive pre-checks. A check the user declines aborts the whole export. */
  checks?: {
    nounProject?: boolean;
  };
  convert?: {
    /** Replace bitmaps with a filled rectangle: framing only needs the outline. */
    bitmapToRect?: boolean;
    /** Rasterize clipped content, for backends that cannot resolve a clip-path. */
    clipPath?: boolean;
    /** Resample images to the resolution the task will actually engrave at. */
    imageResolution?: boolean;
    /** Rasterize vector shapes on layers that engrave as bitmap. */
    shapeToBitmap?: boolean;
    /**
     * Point `use` back at the original vector symbols. Image symbols reference blob urls that
     * only resolve inside the editing session, so anything serialized while they are active is
     * unreadable outside the app.
     */
    symbol?: boolean;
    /**
     * Convert text to paths, for consumers that cannot resolve fonts. `'pathPerChar'` keeps each
     * character a separate path, which the Promark hull needs to trace around them.
     */
    text?: 'pathPerChar' | boolean;
    /** Bake variable text down to its current value. */
    variableText?: boolean;
  };
  insert?: {
    /**
     * Inline webfont bytes into the output. For raster targets, which render through an isolated
     * `<img>` that cannot see the app document's fonts. Alternative to `convert.text`, not a
     * companion to it.
     */
    webFontFace?: boolean;
  };
  output?:
    | {
        /** Move the drawing back down into positive coordinates, which the task backends expect. */
        fixTopExpansion?: boolean;
        type?: 'svgString';
        unit?: Units;
      }
    | { dpi?: number; orientation?: 'landscape' | 'portrait'; type: 'a4Base64' };
  remove?: {
    /** Strip the scene mask so the output is not clipped to the workarea. */
    clipPath?: boolean;
    /**
     * Exclude Noun Project artwork the user has disassembled. Disassembling copies `data-np="1"`
     * onto every descendant, so dropping the elements whose parent also carries it empties the
     * shape out and keeps the licensed vector data from being redistributed. Paired with
     * `checks.nounProject`, which tells the user this is about to happen.
     */
    npElements?: boolean;
    selection?: boolean;
    unusedDefs?: boolean;
  };
  /** Which part of the canvas ends up in the output. Defaults to the whole scene. */
  scope?: {
    layerModule?: LayerModuleType;
  };
};

/**
 * The fixed option set per export target. Call sites name a target; they never assemble options
 * themselves, so a policy change happens here once instead of in every handler.
 */
export const canvasContentPresets = {
  /**
   * `.beam` scene file. Deliberately converts nothing: variable text stays variable and `use` keeps
   * pointing at image symbols, because the file re-opens in the editor, carries an imageSource
   * block, and stores a rendered thumbnail of its own rather than being re-rendered from source.
   *
   * It also keeps Noun Project artwork, which is what the export warning promises the user: .beam
   * is the format that holds their entire scene.
   */
  beam: {
    remove: { selection: true, unusedDefs: true },
  },
  /** `.bvg` scene file: keeps text and layer structure editable for re-opening in Beam Studio. */
  bvg: {
    checks: { nounProject: true },
    convert: { symbol: true, variableText: true },
    remove: { npElements: true, selection: true, unusedDefs: true },
  },
  /**
   * Framing measures the drawing rather than exporting it, so the canvas has to be in the state the
   * job will actually run in: variable text baked to the value that will be marked, and `use`
   * pointing at vector symbols so it reports the geometry the laser will follow.
   */
  framingBBox: {
    convert: { symbol: true, variableText: true },
  },
  /** The same state as `framingBBox`, plus bitmaps collapsed to rectangles: the hull needs only their outline. */
  framingRaster: {
    convert: { bitmapToRect: true, symbol: true, variableText: true },
  },
  /**
   * Raster targets (jpg / png). Text stays as text and the fonts ride along inline, so the render
   * resolves the same faces the canvas does.
   *
   * Unlike bvg/svg these run no Noun Project exclusion: rasterizing does not redistribute the
   * vector artwork, so there is nothing to strip.
   */
  image: {
    convert: { symbol: true, variableText: true },
    insert: { webFontFace: true },
    remove: { selection: true, unusedDefs: true },
  },
  /**
   * Print and Cut renders the design twice: once as the pdf that gets printed, once as the raster
   * whose silhouette becomes the cut path. Both have to see the same drawing, or the cut misses
   * what was printed — so both bake variable text and point `use` at vector symbols.
   *
   * Text stays text on purpose: the render inlines the webfont bytes instead, so the printed glyphs
   * and the traced contour resolve the same faces the canvas does.
   */
  printAndCut: {
    convert: { symbol: true, variableText: true },
  },
  /** `.svg` for other software: text as paths, mm units, no scene mask. */
  svg: {
    checks: { nounProject: true },
    convert: { symbol: true, text: true, variableText: true },
    output: { unit: 'mm' },
    remove: { clipPath: true, npElements: true, selection: true, unusedDefs: true },
  },
  /**
   * The scene as a task backend needs it: text flattened, images at engraving resolution, shapes
   * that engrave as bitmap rasterized, and the layer annotations that say how to cut it.
   * Variable text is left alone — the callers decide whether to bake, strip or extract it, because
   * a variable-text job is several tasks rather than one.
   *
   * Unlike `taskSwiftray` this does not rasterize clip paths, which is how it has always been.
   * Whether fluxghost resolves them itself or has been quietly dropping them is unverified.
   */
  task: {
    annotate: { curveZSpeed: true, layerBBox: true, layerDpmm: true, printingColor: true, splitFullColor: true },
    capture: { thumbnail: true },
    convert: { imageResolution: true, shapeToBitmap: true, symbol: true, text: true },
    output: { fixTopExpansion: true },
    remove: { unusedDefs: true },
  },
  /** Promark framing, tracing around each character. */
  taskFramingHull: {
    convert: { bitmapToRect: true, clipPath: true, symbol: true, text: 'pathPerChar', variableText: true },
    output: { fixTopExpansion: true },
    remove: { unusedDefs: true },
  },
  /** Promark framing: just the outline, so bitmaps collapse to rectangles and nothing is annotated. */
  taskFramingOutline: {
    convert: { bitmapToRect: true, clipPath: true, symbol: true, text: true, variableText: true },
    output: { fixTopExpansion: true },
    remove: { unusedDefs: true },
  },
  /** Same as `task`, plus the clip-path rasterization Swiftray cannot do itself. */
  taskSwiftray: {
    annotate: { curveZSpeed: true, layerBBox: true, layerDpmm: true, printingColor: true, splitFullColor: true },
    capture: { thumbnail: true },
    convert: { clipPath: true, imageResolution: true, shapeToBitmap: true, symbol: true, text: true },
    output: { fixTopExpansion: true },
    remove: { unusedDefs: true },
  },
  /**
   * The printable sheet behind the UV Print pdf: only UV Print layers, laid out on A4.
   * `layersToA4Base64` inlines the webfonts itself, so `insert.webFontFace` does not apply here.
   */
  uvPdf: {
    convert: { symbol: true, variableText: true },
    output: { type: 'a4Base64' },
    remove: { selection: true, unusedDefs: true },
    scope: { layerModule: LayerModule.UV_PRINT },
  },
} as const satisfies Record<string, CanvasContentOptions>;

export type CanvasContentTarget = keyof typeof canvasContentPresets;

/** The targets whose content goes to a task backend rather than into a file the user keeps. */
export type TaskCanvasContentTarget = Extract<
  CanvasContentTarget,
  'task' | 'taskFramingHull' | 'taskFramingOutline' | 'taskSwiftray'
>;

export type TaskCanvasContent = {
  svgString: string;
  /** A png data url, or '' for targets that capture no thumbnail. */
  thumbnail: string;
  /** Blob url of the same image, for the monitor to display. */
  thumbnailBlobURL: string;
};

type Revert = (() => void) | null | undefined;

const getPreset = (target: CanvasContentTarget): CanvasContentOptions =>
  canvasContentPresets[target] as CanvasContentOptions;

/**
 * Detach every layer's clip-path, remembering what each one had. Layers are not required to carry
 * the scene mask, so the revert restores the original value per layer instead of stamping one on.
 */
const detachLayerClipPaths = (): (() => void) => {
  const layers = Array.from(document.querySelectorAll<SVGGElement>('#svgcontent g.layer'));
  const originals = layers.map((layer) => [layer, layer.getAttribute('clip-path')] as const);

  layers.forEach((layer) => layer.removeAttribute('clip-path'));

  return () => {
    originals.forEach(([layer, clipPath]) => {
      if (clipPath === null) layer.removeAttribute('clip-path');
      else layer.setAttribute('clip-path', clipPath);
    });
  };
};

const getScopedLayers = async (scope: CanvasContentOptions['scope']): Promise<SVGGElement[]> => {
  const { default: layerManager } = await load.layerManager();
  const groups = layerManager.getAllLayers().map((layer) => layer.getGroup());

  if (scope?.layerModule === undefined) return groups;

  const { getData } = await load.layerConfig();

  return groups.filter((group) => getData(group, 'module') === scope.layerModule);
};

/**
 * Run the target's pre-checks and the clean-up that is not reverted afterwards.
 *
 * Kept separate from `getCanvasContent` because the checks are questions to the user: they belong
 * before the save dialog, while the content itself is only built once a path is chosen.
 *
 * @returns false when the user declined a check, in which case the export must not proceed.
 */
export const prepareCanvasContent = async (target: CanvasContentTarget): Promise<boolean> => {
  const { checks = {}, remove = {} } = getPreset(target);

  if (checks.nounProject && !(await checkNounProjectElements())) return false;

  if (remove.selection) (await load.selectionManager()).default.clearSelection();

  if (remove.unusedDefs) svgCanvas.removeUnusedDefs();

  return true;
};

/**
 * The changes that belong in the task thumbnail: what the preview shows is what gets cut.
 *
 * @returns false when the user cancelled the font substitution prompt, which aborts the export.
 */
const applyDrawingChanges = async (preset: CanvasContentOptions, reverts: Revert[]): Promise<boolean> => {
  const { convert = {}, remove = {} } = preset;

  if (convert.variableText) {
    const { convertVariableText } = await load.convertVariableText();

    reverts.push(await convertVariableText());
  }

  if (convert.text) {
    const { convertAllTextToPath } = await load.convertAllTextToPath();
    const { revert, success } = await convertAllTextToPath({ pathPerChar: convert.text === 'pathPerChar' });

    reverts.push(revert);

    if (!success) return false;
  }

  if (remove.clipPath) reverts.push(detachLayerClipPaths());

  return true;
};

/** The changes only the backend needs, applied once the thumbnail has been taken. */
const applyBackendChanges = async (
  preset: CanvasContentOptions,
  reverts: Revert[],
  device: IDeviceInfo | null,
): Promise<void> => {
  const { annotate = {}, convert = {} } = preset;

  if (annotate.layerDpmm) (await load.annotateLayerDpmm()).annotateLayerDpmm(device);

  if (annotate.curveZSpeed) {
    const { annotateCurveEngravingZSpeed, removeCurveEngravingZSpeedAnnotation } =
      await load.annotateCurveEngravingZSpeed();

    annotateCurveEngravingZSpeed(device);
    reverts.push(removeCurveEngravingZSpeedAnnotation);
  }

  if (convert.imageResolution) reverts.push(await (await load.updateImagesResolution()).default());

  if (convert.shapeToBitmap) reverts.push(await (await load.convertShapeToBitmap()).default());

  if (convert.bitmapToRect) reverts.push((await load.convertBitmapToInfilledRect()).default());

  if (annotate.printingColor) reverts.push((await load.annotatePrintingColor()).default());

  if (annotate.splitFullColor) reverts.push(await (await load.splitFullColorLayer()).tempSplitFullColorLayers());

  if (convert.clipPath) reverts.push(await (await load.convertClipPath()).default());

  if (annotate.layerBBox) reverts.push((await load.annotateLayerBBox()).annotateLayerBBox());
};

/**
 * Put the canvas into the state `preset` describes, run `produce`, then restore everything —
 * including when `produce` throws.
 *
 * The symbol switch is the outermost wrapper so it is the last thing undone: anything detached and
 * put back inside it (Noun Project shapes) is returned to image symbols along with the rest.
 *
 * @returns null when the user cancelled the font substitution prompt.
 */
const runPrepared = async <T>(
  preset: CanvasContentOptions,
  produce: (reverts: Revert[]) => Promise<T> | T,
  device: IDeviceInfo | null,
): Promise<null | T> => {
  const { convert = {}, remove = {} } = preset;
  const build = async (): Promise<null | T> => {
    const reverts: Revert[] = [];

    try {
      if (!(await applyDrawingChanges(preset, reverts))) return null;

      await applyBackendChanges(preset, reverts, device);

      return await produce(reverts);
    } finally {
      reverts.toReversed().forEach((revert) => revert?.());
    }
  };
  const withNPElements = remove.npElements ? () => removeNPElementsWrapper(build) : build;

  return convert.symbol ? switchSymbolWrapper(withNPElements) : withNPElements();
};

/**
 * Read something off the canvas with a target's preparation applied.
 *
 * For callers that measure or rasterize the canvas themselves: the preset decides what state the
 * canvas is in, `produce` decides what to take from it.
 *
 * Call `prepareCanvasContent` for the same target first.
 *
 * @returns null when the user cancelled the font substitution prompt.
 */
export const withCanvasContent = async <T>(
  target: CanvasContentTarget,
  produce: () => Promise<T> | T,
  { device = null }: { device?: IDeviceInfo | null } = {},
): Promise<null | T> => runPrepared(getPreset(target), produce, device);

/**
 * Build the canvas content for a task backend, plus the thumbnail the machine displays.
 *
 * The thumbnail is taken partway through on purpose: after the drawing itself is final, before the
 * annotations and rasterization that only describe how to cut it. That ordering is why this does
 * not go through `withCanvasContent`.
 *
 * Call `prepareCanvasContent` for the same target first.
 *
 * @returns null when the user cancelled during font substitution.
 */
export const getTaskCanvasContent = async (
  target: TaskCanvasContentTarget,
  { device = null, onProgress }: { device?: IDeviceInfo | null; onProgress?: (message: string) => void } = {},
): Promise<null | TaskCanvasContent> => {
  const preset = getPreset(target);
  const { capture = {}, convert = {}, output = {} } = preset;
  const reverts: Revert[] = [];
  const build = async (): Promise<null | TaskCanvasContent> => {
    try {
      if (!(await applyDrawingChanges(preset, reverts))) return null;

      let thumbnail = '';
      let thumbnailBlobURL = '';

      if (capture.thumbnail) {
        onProgress?.('Generating Thumbnail');
        ({ thumbnail, thumbnailBlobURL } = await (await load.generateThumbnail()).default());
      }

      onProgress?.('Applying layer settings');
      await applyBackendChanges(preset, reverts, device);

      onProgress?.('Generating Upload File');

      const fixTopExpansion = output.type === 'a4Base64' ? undefined : output.fixTopExpansion;

      return { svgString: svgCanvas.getSvgString({ fixTopExpansion }), thumbnail, thumbnailBlobURL };
    } finally {
      reverts.toReversed().forEach((revert) => revert?.());
    }
  };

  return convert.symbol ? switchSymbolWrapper(build) : build();
};

/**
 * Build the canvas content for an export target: an svg string, or a base64 png for targets that
 * rasterize. Every change made to the live canvas along the way is reverted before returning,
 * including when the build throws.
 *
 * Call `prepareCanvasContent` for the same target first.
 */
export const getCanvasContent = async (target: CanvasContentTarget): Promise<string> => {
  const preset = getPreset(target);
  const { insert = {}, output = {}, scope } = preset;
  const produce = async (): Promise<string> => {
    if (output.type === 'a4Base64') {
      const { layersToA4Base64 } = await load.layersToA4Base64();

      return layersToA4Base64(await getScopedLayers(scope), { dpi: output.dpi, orientation: output.orientation });
    }

    const svgString = svgCanvas.getSvgString({ unit: output.unit });

    if (!insert.webFontFace) return svgString;

    const { buildWebFontFaceCss } = await load.webFontFaceCss();
    const fontFaceCss = await buildWebFontFaceCss([document.getElementById('svgcontent')!]);

    return svgString.replace(/<svg[^>]*>/, (svgTag) => svgTag + fontFaceCss);
  };

  // None of the file targets convert text, so the cancel path cannot be reached here.
  return (await runPrepared(preset, produce, null)) ?? '';
};
