import paper from 'paper';
import { PaperOffset } from 'paperjs-offset';
import { match } from 'ts-pattern';

import fontFuncs, { convertTextToPathByFontkit, getFontObj } from '@core/app/actions/beambox/font-funcs';
import NS from '@core/app/constants/namespaces';

import { svgCache } from './buildKeychainElement';
import { collectPathItems } from './buildKeychainShape';
import { createTextElement } from './buildKeychainText';
import { PX_TO_MM_RATIO } from './constants';
import type { ShapeElementPositionRef, CustomShapeOptionValues } from './types';

export const generateShapeTextPathD = async (values: CustomShapeOptionValues): Promise<null | string> => {
  const { font, fontSize, letterSpacing, lineSpacing, text } = values;

  if (!text.trim()) return null;

  const fontDesc = fontFuncs.getFontOfPostscriptName(font.postscriptName);

  if (!fontDesc) return null;

  const textEl = createTextElement(text, font, fontSize, letterSpacing, lineSpacing);

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
  outlineOffset: number = 0,
): paper.Point => {
  const { offset, point } = match(positionRef)
    .with('bottomCenter', () => ({
      offset: { x: 0, y: size / 2 + outlineOffset / 2 },
      point: textBounds.bottomCenter,
    }))
    .with('leftCenter', () => ({ offset: { x: -size / 2 - outlineOffset / 2, y: 0 }, point: textBounds.leftCenter }))
    .with('rightCenter', () => ({ offset: { x: size / 2 + outlineOffset / 2, y: 0 }, point: textBounds.rightCenter }))
    .with('topCenter', () => ({ offset: { x: 0, y: -size / 2 - outlineOffset / 2 }, point: textBounds.topCenter }))
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
): Promise<{ basePath: null | paper.PathItem; innerPath: null | paper.PathItem; project: paper.Project }> => {
  const project = new paper.Project(document.createElement('canvas'));
  const pathD = await generateShapeTextPathD(values);

  if (!pathD) return { basePath: null, innerPath: null, project };

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

  const outlineOffset = values.outlineOffset * PX_TO_MM_RATIO;

  // Unite element shape into both basePath and innerPath
  if (values.element.shapeKey) {
    const textBounds = basePath.bounds;
    const center = getElementCenter(textBounds, values.element.positionRef, values.fontSize, outlineOffset);
    const elementPath = buildElementPath(project, values.element.shapeKey, values.fontSize, center);

    if (elementPath) {
      basePath = basePath.unite(elementPath);
      innerPath = innerPath.unite(elementPath);
      elementPath.remove();
    }
  }

  if (!innerPath || outlineOffset <= 0) return { basePath, innerPath: null, project };

  basePath = PaperOffset.offset(basePath as paper.Path, outlineOffset, {
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

  return { basePath, innerPath, project };
};
