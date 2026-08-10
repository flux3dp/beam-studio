import type { EngravingMode } from '@core/app/constants/innerEngraving';
import { DEFAULT_LAYER_HEIGHT, DEFAULT_POINT_SPACING } from '@core/app/constants/innerEngraving';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { STL_ATTR } from './constants';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

/**
 * The engraving parameters of an STL object, read off its projection rect.
 *
 * These live on the rect rather than in the STL store because they are what the **backend** reads:
 * the rect is what ends up in the svg string sent to swiftray, so keeping them anywhere else would
 * mean a second serialization path. It also means undo comes for free through svgedit's attribute
 * commands.
 *
 * Infill is deliberately absent here: it is the rect's own `fill`, handled by the shared
 * `InFillBlock`, so there is one fill concept in the app rather than two.
 */
export interface StlEngravingParams {
  layerHeight: number;
  mode: EngravingMode;
  pointSpacing: number;
}

/** A positive number from an attribute, or the default when it is absent, unparseable or <= 0. */
const readPositive = (value: null | string, fallback: number): number => {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const getStlEngravingParams = (elem: Element): StlEngravingParams => {
  return {
    layerHeight: readPositive(elem.getAttribute(STL_ATTR.layerHeight), DEFAULT_LAYER_HEIGHT),
    mode: elem.getAttribute(STL_ATTR.mode) === 'dot' ? 'dot' : 'line',
    pointSpacing: readPositive(elem.getAttribute(STL_ATTR.pointSpacing), DEFAULT_POINT_SPACING),
  };
};

/**
 * Write one parameter, with undo.
 *
 * Goes through `changeSelectedAttribute` rather than `setAttribute` so the change lands in svgedit's
 * history like any other attribute edit — a 3D transform needs its own command (the mesh is not in
 * the DOM), but these are plain attributes on an element that is.
 */
export const setStlEngravingParam = (elem: Element, attr: string, value: number | string): void => {
  svgCanvas.changeSelectedAttribute(attr, value, [elem]);
};
