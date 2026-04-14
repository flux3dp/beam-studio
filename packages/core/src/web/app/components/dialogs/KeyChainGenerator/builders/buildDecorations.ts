import type paper from 'paper';

import NS from '@core/app/constants/namespaces';

import type { ElementOptionDef, KeyChainState, TextOptionDef } from '../types';

import { applyElements } from './buildElement';
import { applyTexts } from './buildText';

interface DecorationResult {
  emboss: SVGElement[];
  engraving: SVGElement[];
}

/**
 * Runs the decoration helpers (applyTexts, applyElements) against temporary SVG elements,
 * splitting definitions by emboss flag, and returns both engraving and emboss decoration arrays.
 */
export const buildDecorations = async (
  project: paper.Project,
  state: KeyChainState,
  textDefs: TextOptionDef[],
  elementDefs: ElementOptionDef[],
): Promise<DecorationResult> => {
  const engravingTextDefs = textDefs.filter((d) => !state.texts[d.id]?.emboss);
  const engravingElementDefs = elementDefs.filter((d) => !state.elements[d.id]?.emboss);
  const embossTextDefs = textDefs.filter((d) => state.texts[d.id]?.emboss);
  const embossElementDefs = elementDefs.filter((d) => state.elements[d.id]?.emboss);

  // Build engraving decorations
  const tempSvg = document.createElementNS(NS.SVG, 'svg');

  await applyTexts(tempSvg, state, engravingTextDefs);
  applyElements(project, tempSvg, state, engravingElementDefs);

  const engraving = Array.from(tempSvg.children) as SVGElement[];

  // Build emboss decorations
  const embossSvg = document.createElementNS(NS.SVG, 'svg');

  await applyTexts(embossSvg, state, embossTextDefs);
  applyElements(project, embossSvg, state, embossElementDefs);

  const emboss = Array.from(embossSvg.children) as SVGElement[];

  return { emboss, engraving };
};
