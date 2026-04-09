import paper from 'paper';
import { PaperOffset } from 'paperjs-offset';

import fontFuncs, { convertTextToPathByFontkit, getFontObj } from '@core/app/actions/beambox/font-funcs';
import NS from '@core/app/constants/namespaces';
import type { GeneralFont } from '@core/interfaces/IFont';

import { PX_TO_MM_RATIO } from './constants';
import type { ShapeTextOptionValues } from './types';

const createShapeTextSvg = (
  values: ShapeTextOptionValues,
  font: GeneralFont,
): { svg: SVGSVGElement; textEl: SVGTextElement } => {
  const { fontSize, text } = values;
  const svg = document.createElementNS(NS.SVG, 'svg');

  svg.setAttribute('xmlns', NS.SVG);

  const textEl = document.createElementNS(NS.SVG, 'text');
  const tspan = document.createElementNS(NS.SVG, 'tspan');

  textEl.setAttribute('font-family', `'${font.family}'`);
  textEl.setAttribute('font-postscript', font.postscriptName);

  if (font.weight) {
    textEl.setAttribute('font-weight', String(font.weight ?? 400));

    if (font.italic) {
      textEl.setAttribute('font-style', 'italic');
    }
  }

  textEl.setAttribute('font-size', String(fontSize));
  textEl.setAttribute('fill', 'none');
  textEl.setAttribute('stroke', '#000000');
  textEl.setAttribute('text-anchor', 'middle');
  tspan.setAttribute('x', '0');
  tspan.setAttribute('y', String(fontSize));
  tspan.textContent = text;
  textEl.appendChild(tspan);
  svg.appendChild(textEl);

  return { svg, textEl };
};

export const generateShapeTextPathD = async (values: ShapeTextOptionValues): Promise<null | string> => {
  const textContent = values.text.trim();

  if (!textContent) return null;

  const fontDesc = fontFuncs.getFontOfPostscriptName(values.font.postscriptName);

  if (!fontDesc) return null;

  const { svg, textEl } = createShapeTextSvg(values, fontDesc);

  svg.style.visibility = 'hidden';
  svg.style.position = 'absolute';
  document.body.appendChild(svg);

  try {
    if (!fontDesc) return null;

    const fontObj = await getFontObj(fontDesc);

    if (!fontObj) return null;

    const result = convertTextToPathByFontkit(textEl, fontObj, false);

    if (!result?.d) return null;

    if (typeof result.d === 'string') return result.d;

    return result.d.join(' ');
  } finally {
    svg.remove();
  }
};

export const generateShapeTextBaseShape = async (
  values: ShapeTextOptionValues,
): Promise<{ basePath: null | paper.PathItem; innerPath: null | paper.PathItem; project: paper.Project }> => {
  const project = new paper.Project(document.createElement('canvas'));
  const pathD = await generateShapeTextPathD(values);

  if (!pathD) return { basePath: null, innerPath: null, project };

  const segments = pathD
    .split(/(?=[M])/)
    .map((s) => s.trim())
    .filter(Boolean);

  let innerPath = new paper.Path();
  let basePath = new paper.Path();

  for (const segment of segments) {
    const subPath = new paper.Path(segment);

    basePath = basePath.unite(subPath) as paper.Path;
    innerPath = innerPath.exclude(subPath) as paper.Path;
    subPath.remove();
  }

  innerPath.strokeColor = basePath.strokeColor = new paper.Color(0, 0, 0);
  innerPath.strokeWidth = basePath.strokeWidth = 1;
  innerPath.strokeScaling = basePath.strokeScaling = false;

  const offset = values.outlineOffset;

  if (!innerPath || offset <= 0) return { basePath, innerPath: null, project };

  const offsetPath = PaperOffset.offset(basePath as paper.Path, offset * PX_TO_MM_RATIO, {
    join: 'round',
  }) as paper.Path;

  return { basePath: offsetPath, innerPath, project };
};
