import paper from 'paper';
import { PaperOffset } from 'paperjs-offset';
import { match } from 'ts-pattern';

import fontFuncs, { convertTextToPathByFontkit, getFontObj } from '@core/app/actions/beambox/font-funcs';
import NS from '@core/app/constants/namespaces';

import { PX_TO_MM_RATIO } from '../constants';
import type { CustomShapeOptionValues, ShapeElementPositionRef, SizeDimension } from '../types';

import { svgCache } from './buildElement';
import { collectPathItems } from './buildShape';
import { createTextElement } from './buildText';

export const generateShapeTextPathD = async (values: CustomShapeOptionValues): Promise<null | string> => {
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

const getElementCenter = (
  textBounds: paper.Rectangle,
  positionRef: ShapeElementPositionRef,
  size: number,
): paper.Point => {
  const { offset, point } = match(positionRef)
    .with('bottomCenter', () => ({
      offset: { x: 0, y: 0.55 * size },
      point: textBounds.bottomCenter,
    }))
    .with('leftCenter', () => ({ offset: { x: -0.55 * size, y: 0 }, point: textBounds.leftCenter }))
    .with('rightCenter', () => ({ offset: { x: 0.55 * size, y: 0 }, point: textBounds.rightCenter }))
    .with('topCenter', () => ({ offset: { x: 0, y: -0.55 * size }, point: textBounds.topCenter }))
    .exhaustive();

  return point.add(new paper.Point(offset.x, offset.y));
};

const buildElementPath = (
  project: paper.Project,
  shapeKey: string,
  size: number,
  center: paper.Point,
): null | paper.PathItem => {
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

  const targetBounds = new paper.Rectangle(center.x - size / 2, center.y - size / 2, size, size);

  shapePath.fitBounds(targetBounds);
  svgItem.remove();

  return shapePath;
};

export const generateCustomBaseShape = async (
  values: CustomShapeOptionValues,
  size?: { dimension: SizeDimension; value: number },
): Promise<{
  basePath: null | paper.PathItem;
  innerPath: null | paper.PathItem;
  project: paper.Project;
  sizeRatio: number;
}> => {
  const project = new paper.Project(document.createElement('canvas'));
  const pathD = await generateShapeTextPathD(values);

  if (!pathD) return { basePath: null, innerPath: null, project, sizeRatio: 1 };

  let innerPath: paper.PathItem = new paper.Path();
  let basePath: paper.PathItem = new paper.Path();

  const segments = pathD.split(/(?=[M])/).filter(Boolean);

  for (const segment of segments) {
    const subPath = new paper.Path(segment);

    basePath = basePath.unite(subPath);

    if (innerPath.intersects(subPath)) {
      innerPath = innerPath.unite(subPath);
    } else {
      innerPath = innerPath.exclude(subPath);
    }
  }

  innerPath.strokeColor = basePath.strokeColor = new paper.Color(0, 0, 0);
  innerPath.strokeWidth = basePath.strokeWidth = 1;
  innerPath.strokeScaling = basePath.strokeScaling = false;

  // Unite element shape into both basePath and innerPath
  if (values.element.shapeKey) {
    const textBounds = basePath.bounds;
    const center = getElementCenter(textBounds, values.element.positionRef, values.fontSize);
    const elementPath = buildElementPath(project, values.element.shapeKey, values.fontSize, center);

    if (elementPath) {
      basePath = basePath.unite(elementPath);
      innerPath = innerPath.unite(elementPath);
      elementPath.remove();
    }
  }

  const outlineOffset = values.outlineOffset * PX_TO_MM_RATIO;

  // Compute sizeRatio from the target size vs natural inner-path bounds
  let sizeRatio = 1;

  if (size && size.value > 0) {
    const innerDim = innerPath.bounds[size.dimension];

    if (innerDim > 0) {
      const effectiveTarget = (size.value - 2 * values.outlineOffset) * PX_TO_MM_RATIO;

      sizeRatio = effectiveTarget > 0 ? effectiveTarget / innerDim : 1;
    }
  }

  const compensatedOffset = outlineOffset / sizeRatio;

  if (!innerPath || compensatedOffset <= 0) return { basePath, innerPath: null, project, sizeRatio };

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

  return { basePath, innerPath, project, sizeRatio };
};
