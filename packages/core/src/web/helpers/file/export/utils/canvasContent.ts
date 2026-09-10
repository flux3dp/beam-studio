import {
  annotateCurveEngravingZSpeed,
  removeCurveEngravingZSpeedAnnotation,
} from '@core/app/actions/beambox/export/annotateCurveEngravingZSpeed';
import { annotateLayerBBox } from '@core/app/actions/beambox/export/annotateLayerBBox';
import { annotateLayerDpmm } from '@core/app/actions/beambox/export/annotateLayerDpmm';
import generateThumbnail from '@core/app/actions/beambox/export/generate-thumbnail';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import layerManager from '@core/app/svgedit/layer/layerManager';
import selectionManager from '@core/app/svgedit/selection';
import updateImagesResolution from '@core/helpers/image/updateImagesResolution';
import { buildWebFontFaceCss } from '@core/helpers/image/webFontFaceCss';
import annotatePrintingColor from '@core/helpers/layer/annotatePrintingColor';
import convertBitmapToInfilledRect from '@core/helpers/layer/convertBitmapToInfilledRect';
import convertClipPath from '@core/helpers/layer/convertClipPath';
import convertShapeToBitmap from '@core/helpers/layer/convertShapeToBitmap';
import { tempSplitFullColorLayers } from '@core/helpers/layer/full-color/splitFullColorLayer';
import { getData } from '@core/helpers/layer/layer-config-helper';
import { layersToA4Base64 } from '@core/helpers/layer/layersToA4Base64';
import { convertAllTextToPath } from '@core/helpers/path/convertToPath';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { Units } from '@core/helpers/units';
import { convertVariableText } from '@core/helpers/variableText';
import type { IDeviceInfo } from '@core/interfaces/IDevice';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { switchSymbolWrapper } from './common';
import { checkNounProjectElements, removeNPElementsWrapper } from './nounProject';

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

const getScopedLayers = (scope: CanvasContentOptions['scope']): SVGGElement[] => {
  const groups = layerManager.getAllLayers().map((layer) => layer.getGroup());

  if (scope?.layerModule === undefined) return groups;

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

  if (remove.selection) selectionManager.clearSelection();

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

  if (convert.variableText) reverts.push(await convertVariableText());

  if (convert.text) {
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

  if (annotate.layerDpmm) annotateLayerDpmm(device);

  if (annotate.curveZSpeed) {
    annotateCurveEngravingZSpeed(device);
    reverts.push(removeCurveEngravingZSpeedAnnotation);
  }

  if (convert.imageResolution) reverts.push(await updateImagesResolution());

  if (convert.shapeToBitmap) reverts.push(await convertShapeToBitmap());

  if (convert.bitmapToRect) reverts.push(convertBitmapToInfilledRect());

  if (annotate.printingColor) reverts.push(annotatePrintingColor());

  if (annotate.splitFullColor) reverts.push(await tempSplitFullColorLayers());

  if (convert.clipPath) reverts.push(await convertClipPath());

  if (annotate.layerBBox) reverts.push(annotateLayerBBox());
};

/**
 * Build the canvas content for a task backend, plus the thumbnail the machine displays.
 *
 * The thumbnail is taken partway through on purpose: after the drawing itself is final, before the
 * annotations and rasterization that only describe how to cut it.
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
        ({ thumbnail, thumbnailBlobURL } = await generateThumbnail());
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
  const { convert = {}, insert = {}, output = {}, remove = {}, scope } = getPreset(target);
  const reverts: Array<(() => void) | null | undefined> = [];

  try {
    if (convert.variableText) reverts.push(await convertVariableText());

    if (convert.text) reverts.push((await convertAllTextToPath()).revert);

    if (remove.clipPath) reverts.push(detachLayerClipPaths());

    if (output.type === 'a4Base64') {
      const layers = getScopedLayers(scope);
      const build = () => layersToA4Base64(layers, { dpi: output.dpi, orientation: output.orientation });

      return await (convert.symbol ? switchSymbolWrapper(build) : build());
    }

    const serialize = () => svgCanvas.getSvgString({ unit: output.unit });
    const withSymbol = convert.symbol ? () => switchSymbolWrapper(serialize) : serialize;
    const svgString = await (remove.npElements ? removeNPElementsWrapper(withSymbol) : withSymbol());

    if (!insert.webFontFace) return svgString;

    const fontFaceCss = await buildWebFontFaceCss([document.getElementById('svgcontent')!]);

    return svgString.replace(/<svg[^>]*>/, (svgTag) => svgTag + fontFaceCss);
  } finally {
    reverts.toReversed().forEach((revert) => revert?.());
  }
};
