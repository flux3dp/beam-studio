import type paper from 'paper';

import NS from '@core/app/constants/namespaces';

import { DECORATION_PATHS } from '../constants/decorations';
import type { DecorationPathOptionDef, ElementOptionDef, KeyChainState, TextOptionDef } from '../types';

import { applyElements } from './buildElement';
import { applyTexts } from './buildText';

interface DecorationResult {
  emboss: SVGElement[];
  engraving: SVGElement[];
}

const applyDecorationPaths = (
  svg: SVGSVGElement,
  state: KeyChainState,
  decorationDefs: DecorationPathOptionDef[],
): void => {
  for (const def of decorationDefs) {
    const values = state.decorationPaths[def.id];

    if (!values?.enabled) continue;

    const d = DECORATION_PATHS[values.selectedKey];

    if (!d) continue;

    const pathEl = document.createElementNS(NS.SVG, 'path');

    pathEl.setAttribute('d', d);
    pathEl.setAttribute('fill', '#000');
    svg.appendChild(pathEl);
  }
};

/**
 * Runs the decoration helpers (applyTexts, applyElements, applyDecorationPaths) against
 * temporary SVG elements, splitting definitions by emboss flag, and returns both engraving
 * and emboss decoration arrays.
 */
export const buildDecorations = async (
  project: paper.Project,
  state: KeyChainState,
  textDefs: TextOptionDef[],
  elementDefs: ElementOptionDef[],
  decorationDefs: DecorationPathOptionDef[],
): Promise<DecorationResult> => {
  const engravingTexts = textDefs.filter((d) => !state.texts[d.id]?.emboss);
  const engravingElements = elementDefs.filter((d) => !state.elements[d.id]?.emboss);
  const engravingDecorationPaths = decorationDefs.filter((d) => !state.decorationPaths[d.id]?.emboss);
  const embossTexts = textDefs.filter((d) => state.texts[d.id]?.emboss);
  const embossElements = elementDefs.filter((d) => state.elements[d.id]?.emboss);
  const embossDecorationPaths = decorationDefs.filter((d) => state.decorationPaths[d.id]?.emboss);

  // Build engraving decorations
  const tempSvg = document.createElementNS(NS.SVG, 'svg');

  await applyTexts(tempSvg, state, engravingTexts);
  await applyElements(project, tempSvg, state, engravingElements);
  applyDecorationPaths(tempSvg, state, engravingDecorationPaths);

  const engraving = Array.from(tempSvg.children) as SVGElement[];

  // Build emboss decorations
  const embossSvg = document.createElementNS(NS.SVG, 'svg');

  await applyTexts(embossSvg, state, embossTexts);
  await applyElements(project, embossSvg, state, embossElements);
  applyDecorationPaths(embossSvg, state, embossDecorationPaths);

  const emboss = Array.from(embossSvg.children) as SVGElement[];

  return { emboss, engraving };
};
