import type { ComponentType } from 'react';
import React from 'react';

import paper from 'paper';
import ReactDomServer from 'react-dom/server';

import progressCaller from '@core/app/actions/progress-caller';
import { builtInElements } from '@core/app/constants/element-panel-constants';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import { fixEnd } from '@core/app/svgedit/operations/pathActions';
import selectionManager from '@core/app/svgedit/selection';
import { getNPIconByID } from '@core/helpers/api/flux-id';
import updateElementColor from '@core/helpers/color/updateElementColor';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import importIcon from '../Element/importIcon';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const TARGET_SIZE = 500;
const progressId = 'import-noun-project-svg';

const collectPathItems = (item: paper.Item): paper.PathItem[] => {
  if (item instanceof paper.Path || item instanceof paper.CompoundPath) {
    return [item];
  }

  if (item instanceof paper.Group || item instanceof paper.Layer) {
    return item.children.flatMap(collectPathItems);
  }

  return [];
};

/**
 * Parse SVG string with paper.js, unite all paths into one, create element via addSvgElementFromJson.
 * Scale to fit 500x500 (matching builtInElements convention).
 */
const importSvgPaths = (svgString: string): void => {
  const canvas = document.createElement('canvas');
  const project = new paper.Project(canvas);

  try {
    const svgItem = project.importSVG(svgString, { expandShapes: true });
    const pathItems = collectPathItems(svgItem);

    if (pathItems.length === 0) return;

    // Unite all paths into a single path
    let unitedPath = pathItems[0];

    for (let i = 1; i < pathItems.length; i += 1) {
      const newPath = unitedPath.unite(pathItems[i]);

      unitedPath.remove();
      pathItems[i].remove();
      unitedPath = newPath;
    }

    // Scale to fit TARGET_SIZE x TARGET_SIZE
    const { bounds } = unitedPath;
    const scale = Math.min(TARGET_SIZE / bounds.width, TARGET_SIZE / bounds.height);

    unitedPath.scale(scale, new paper.Point(bounds.x, bounds.y));
    unitedPath.bounds.left = 0;
    unitedPath.bounds.top = 0;

    const d = unitedPath.pathData;
    const pathEl = svgCanvas.addSvgElementFromJson({
      attr: {
        d,
        fill: '#000',
        'fill-opacity': '1',
        id: svgCanvas.getNextId(),
        stroke: '#000',
        'stroke-width': 1,
      },
      element: 'path',
    }) as SVGPathElement;

    pathEl.setAttribute('d', svgCanvas.pathActions.convertPath(pathEl, false));
    fixEnd(pathEl);
    updateElementColor(pathEl);
    selectionManager.selectOnly([pathEl]);
    undoManager.addCommandToHistory(new history.InsertElementCommand(pathEl));
  } finally {
    project.remove();
  }
};

/**
 * Import a builtInElements jsonMap shape directly via addSvgElementFromJson.
 */
const importJsonElement = (jsonMap: { attr: Record<string, any>; element: string }): void => {
  const newElement = svgCanvas.addSvgElementFromJson({
    ...jsonMap,
    attr: { ...jsonMap.attr, id: svgCanvas.getNextId() },
  });

  undoManager.addCommandToHistory(new history.InsertElementCommand(newElement));
  updateElementColor(newElement);
  selectionManager.selectOnly([newElement]);
};

/**
 * Load builtin SVG icon by key (e.g. "basic/icon-arrow1"), parse and import.
 * Uses dynamic import → renderToStaticMarkup → paper.js parse.
 */
const importBuiltinIcon = async (key: string): Promise<void> => {
  const IconComponent: ComponentType = await importIcon(key);
  const iconString = ReactDomServer.renderToStaticMarkup(<IconComponent />).replace(
    /fill= ?"#(fff(fff)?|FFF(FFF))"/g,
    'fill="none"',
  );

  importSvgPaths(iconString);
};

/**
 * Fetch NP icon by ID, decode base64, parse and import.
 * Shows progress indicator during fetch.
 */
const importNPIcon = async (id: string): Promise<void> => {
  progressCaller.openNonstopProgress({ id: progressId });

  try {
    const base64 = await getNPIconByID(id);

    if (!base64) return;

    const res = await fetch(base64);
    const svgString = await res.text();

    importSvgPaths(svgString);
  } finally {
    progressCaller.popById(progressId);
  }
};

/**
 * Unified entry point. Determines type from key format:
 * - "np/{id}" → importNPIcon
 * - key with builtInElements[fileName] → importJsonElement
 * - otherwise → importBuiltinIcon
 */
export const importElementToCanvas = async (key: string): Promise<void> => {
  if (key.startsWith('np/')) {
    const id = key.substring(3);

    await importNPIcon(id);

    return;
  }

  // Extract fileName from key (last segment after '/')
  const fileName = key.includes('/') ? key.split('/').pop()! : key;

  if (builtInElements[fileName]) {
    importJsonElement(builtInElements[fileName]);

    return;
  }

  await importBuiltinIcon(key);
};
