import NS from '@core/app/constants/namespaces';
import workareaManager from '@core/app/svgedit/workarea';
import i18n from '@core/helpers/i18n';

import styles from './boundary-helper.module.scss';

export type TBoundary = {
  bottom: number;
  left: number;
  right: number;
  top: number;
};

const fontSize = 80;

export const createBoundaryContainer = (id: string): SVGSVGElement => {
  const container = document.createElementNS(NS.SVG, 'svg');

  container.setAttribute('id', id);
  container.setAttribute('x', '0');
  container.setAttribute('y', '0');
  container.setAttribute('width', '100%');
  container.setAttribute('height', '100%');
  container.setAttribute('style', 'pointer-events:none');

  return container;
};

export const createBoundaryPath = (id: string, container: SVGSVGElement, bordered: boolean): SVGPathElement => {
  const elem = document.createElementNS(NS.SVG, 'path');

  elem.setAttribute('id', id);
  elem.setAttribute('class', styles.boundary);
  elem.setAttribute('fill', 'rgba(218, 218, 218, 0.4)');
  elem.setAttribute('fill-rule', 'evenodd');
  elem.setAttribute('stroke', bordered ? '#000' : '');
  elem.setAttribute('vector-effect', 'non-scaling-stroke');
  elem.setAttribute('style', 'pointer-events:auto');
  container.appendChild(elem);

  return elem;
};

export const createBoundaryText = (container: SVGSVGElement): SVGTextElement => {
  const elem = document.createElementNS(NS.SVG, 'text');
  const textNode = document.createTextNode(i18n.lang.layer_module.non_working_area);

  elem.setAttribute('font-size', `${fontSize}`);
  elem.setAttribute('font-weight', 'bold');
  elem.setAttribute('fill', '#999');
  elem.setAttribute('stroke', 'none');
  elem.setAttribute('paint-order', 'stroke');
  elem.setAttribute('style', 'pointer-events:none');
  elem.appendChild(textNode);
  container.appendChild(elem);

  return elem;
};

export const mergeBoundaries = (boundary1: TBoundary, boundary2: TBoundary | undefined): void => {
  if (!boundary2) return;

  boundary1.bottom = Math.max(boundary1.bottom, boundary2.bottom);
  boundary1.left = Math.max(boundary1.left, boundary2.left);
  boundary1.right = Math.max(boundary1.right, boundary2.right);
  boundary1.top = Math.max(boundary1.top, boundary2.top);
};

export const getAbsRect = (left: number, top: number, right: number, bottom: number): string => {
  if (right <= left || bottom <= top) {
    return '';
  }

  return `M${left},${top}H${right}V${bottom}H${left}Z`;
};

export const getRelRect = (x: number, y: number, width: number, height: number): string => {
  if (width <= 0 || height <= 0) {
    return '';
  }

  return `M${x},${y}h${width}v${height}h${-width}Z`;
};

export const getTextPosition = (
  left: number,
  top: number,
  right: number,
  bottom: number,
): { rotate?: boolean; x: number; y: number } => {
  const { maxY, minY, width } = workareaManager;

  if (top >= bottom && top > fontSize) {
    return { x: width / 2, y: minY + top / 2 + fontSize / 2 };
  }

  if (bottom > top && bottom > fontSize) {
    return { x: width / 2, y: maxY - bottom / 2 + fontSize / 2 };
  }

  if (left > right) {
    return { rotate: true, x: 20, y: -30 };
  }

  return { rotate: true, x: width + 20, y: fontSize };
};
