import paper from 'paper';
import { PaperOffset } from 'paperjs-offset';
import { match } from 'ts-pattern';

import fontFuncs, { convertTextToPathByFontkit, getFontObj } from '@core/app/actions/beambox/font-funcs';
import NS from '@core/app/constants/namespaces';

import { PX_TO_MM_RATIO } from '../constants';
import type {
  CustomShapeElementOptionDef,
  CustomShapeElementValues,
  CustomShapeTextValues,
  SizeDimension,
} from '../types';

import { svgCache } from './buildElement';
import { collectPathItems, removeDegenerateCurves } from './buildShape';
import { createTextElement } from './buildText';

export const generateShapeTextPathD = async (values: CustomShapeTextValues): Promise<null | string> => {
  const { font, fontSize, letterSpacing, lineSpacing, text } = values;

  if (!text.trim()) return null;

  const fontDesc = fontFuncs.getFontOfPostscriptName(font.postscriptName);

  if (!fontDesc) return null;

  const textEl = await createTextElement(text, font, fontSize, letterSpacing, lineSpacing);

  // Shape-text uses outline rendering on the temp DOM element (cosmetic; fontkit reads positions only)
  textEl.setAttribute('fill', 'none');
  textEl.setAttribute('stroke', '#000000');

  const svg = document.createElementNS(NS.SVG, 'svg');

  svg.setAttribute('xmlns', NS.SVG);
  svg.appendChild(textEl);

  svg.style.visibility = 'hidden';
  svg.style.position = 'absolute';
  document.body.appendChild(svg);

  try {
    const fontObj = await getFontObj(fontDesc);

    if (!fontObj) return null;

    const result = convertTextToPathByFontkit(textEl, fontObj, false);

    if (!result?.d) return null;

    return result.d as string;
  } finally {
    svg.remove();
  }
};

const buildElementPath = (project: paper.Project, shapeKey: string, size: number): null | paper.PathItem => {
  const cachedSvg = svgCache.get(shapeKey);

  if (!cachedSvg) return null;

  const svgItem = project.importSVG(cachedSvg, { expandShapes: true });
  const pathItems = collectPathItems(svgItem);

  if (pathItems.length === 0) {
    svgItem.remove();

    return null;
  }

  let shapePath: paper.PathItem = pathItems[0];

  for (let i = 1; i < pathItems.length; i += 1) {
    const united = shapePath.unite(pathItems[i]);

    shapePath.remove();
    pathItems[i].remove();
    shapePath = united;
  }

  const targetBounds = new paper.Rectangle(0, 0, size, size);

  shapePath.fitBounds(targetBounds);
  svgItem.remove();

  return shapePath;
};

export const generateCustomBaseShape = async (
  elementOption: CustomShapeElementOptionDef | undefined,
  textValues: CustomShapeTextValues,
  elementValues: CustomShapeElementValues,
  outlineOffsetMm: number,
  size?: { dimension: SizeDimension; value: number },
): Promise<{
  basePath: null | paper.PathItem;
  innerPath: null | paper.PathItem;
  project: paper.Project;
  sizeRatio: number;
}> => {
  const project = new paper.Project(document.createElement('canvas'));

  let innerPath: paper.PathItem = new paper.Path();
  let basePath: paper.PathItem = new paper.Path();

  innerPath.strokeColor = basePath.strokeColor = new paper.Color(0, 0, 0);
  innerPath.strokeWidth = basePath.strokeWidth = 1;
  innerPath.strokeScaling = basePath.strokeScaling = false;

  const pathD = await generateShapeTextPathD(textValues);
  const hasElement = elementOption && elementValues.enabled && elementValues.shapeKey;

  if (!pathD && !hasElement) {
    return { basePath: null, innerPath: null, project, sizeRatio: 1 };
  }

  if (pathD) {
    const segments = pathD.split(/(?=[M])/).filter(Boolean);

    for (const segment of segments) {
      const subPath = new paper.Path(segment);

      const oldBase = basePath;

      basePath = basePath.unite(subPath);
      oldBase.remove();

      const oldInner = innerPath;

      if (innerPath.intersects(subPath)) {
        innerPath = innerPath.unite(subPath);
      } else {
        innerPath = innerPath.exclude(subPath);
      }

      oldInner.remove();
      subPath.remove();
    }
  }

  // Unite element shape into both basePath and innerPath
  if (hasElement) {
    const { positionRef } = elementOption;
    const textBounds = basePath.bounds;
    const referenceSide = match(positionRef)
      .with('topCenter', 'bottomCenter', () => textBounds.width)
      .with('leftCenter', 'rightCenter', () => textBounds.height)
      .exhaustive();
    const elementSize = referenceSide > 0 ? referenceSide * (elementValues.size / 100) : 100;
    const elementPath = buildElementPath(project, elementValues.shapeKey, elementSize);

    if (elementPath) {
      const padding = 0.15 * textValues.fontSize;

      match(positionRef)
        .with('topCenter', () => {
          elementPath.bounds.bottom = basePath.bounds.top - padding;
          elementPath.bounds.center.x = textBounds.center.x;
        })
        .with('bottomCenter', () => {
          elementPath.bounds.top = basePath.bounds.bottom + padding;
          elementPath.bounds.center.x = textBounds.center.x;
        })
        .with('leftCenter', () => {
          elementPath.bounds.right = basePath.bounds.left - padding;
          elementPath.bounds.center.y = textBounds.center.y;
        })
        .with('rightCenter', () => {
          elementPath.bounds.left = basePath.bounds.right + padding;
          elementPath.bounds.center.y = textBounds.center.y;
        })
        .exhaustive();

      basePath = basePath.unite(elementPath);
      innerPath = innerPath.unite(elementPath);
      elementPath.remove();
    }
  }

  const outlineOffset = outlineOffsetMm * PX_TO_MM_RATIO;

  // Compute sizeRatio from the target size vs natural inner-path bounds
  let sizeRatio = 1;

  if (size && size.value > 0) {
    const innerDim = innerPath.bounds[size.dimension];

    if (innerDim > 0) {
      const effectiveTarget = (size.value - 2 * outlineOffsetMm) * PX_TO_MM_RATIO;

      sizeRatio = effectiveTarget > 0 ? effectiveTarget / innerDim : 1;
    }
  }

  const compensatedOffset = outlineOffset / sizeRatio;

  if (!innerPath || compensatedOffset <= 0) return { basePath, innerPath: null, project, sizeRatio };

  // Strip degenerate curves (e.g. sub-pixel artifacts in icon SVGs like icon-sagittarius) that
  // would otherwise make PaperOffset.offset recurse infinitely and overflow the stack.
  removeDegenerateCurves(basePath);

  // Compensate outline so that after uniform scaling by sizeRatio, the final outline = outlineOffset mm
  basePath = PaperOffset.offset(basePath as paper.Path, compensatedOffset, {
    join: 'round',
  }).unite(new paper.Path());

  // Remove inner holes
  if (basePath instanceof paper.CompoundPath) {
    const children = basePath.children.filter((child) => child instanceof paper.Path).sort((a, b) => b.area - a.area);
    const outline = children[0];

    for (let i = 1; i < children.length; i += 1) {
      if (children[i].clockwise !== outline.clockwise) {
        children[i].remove();
      }
    }
  }

  basePath.reorient(false, true); // Force clockwise orientation for consistent normal calculations

  return { basePath, innerPath, project, sizeRatio };
};
