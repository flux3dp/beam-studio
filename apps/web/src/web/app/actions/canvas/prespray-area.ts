import beamboxPreference from 'app/actions/beambox/beambox-preference';
import constant from 'app/actions/beambox/constant';
import history from 'app/svgedit/history/history';
import i18n from 'helpers/i18n';
import LayerModule from 'app/constants/layer-module/layer-modules';
import NS from 'app/constants/namespaces';
import presprayIconUrl from 'app/icons/prespray.svg?url';
import undoManager from 'app/svgedit/history/undoManager';
import workareaManager from 'app/svgedit/workarea';
import { getSupportInfo } from 'app/constants/add-on';

let presprayAreaBlock: SVGImageElement;

const areaWidth = 300;
const areaHeight = 300;

const round = (num: number, decimal: number): number => {
  const factor = 10 ** decimal;
  return Math.round(num * factor) / factor;
};

const togglePresprayArea = (): void => {
  const { model } = workareaManager;
  const shouldShow =
    document.querySelectorAll(`g.layer[data-module="${LayerModule.PRINTER}"]:not([display="none"]`)
      .length > 0;
  const rotaryMode = beamboxPreference.read('rotary_mode');
  const hasJobOrigin =
    beamboxPreference.read('enable-job-origin') && getSupportInfo(model).jobOrigin;
  if (shouldShow && !(rotaryMode && !hasJobOrigin)) presprayAreaBlock.removeAttribute('display');
  else presprayAreaBlock.setAttribute('display', 'none');
};

const getPosition = (mm = false): { x: number; y: number; w: number; h: number } => {
  const pxX = parseInt(presprayAreaBlock?.getAttribute('x'), 10);
  const pxY = parseInt(presprayAreaBlock?.getAttribute('y'), 10);
  const pxW = areaWidth;
  const pxH = areaHeight;
  if (!mm) return { x: pxX, y: pxY, w: pxW, h: pxH };
  const { dpmm } = constant;
  return {
    x: round(pxX / dpmm, 2),
    y: round(pxY / dpmm, 2),
    w: round(pxW / dpmm, 2),
    h: round(pxH / dpmm, 2),
  };
};

const generatePresprayArea = (): void => {
  const fixedSizeSvg = document.getElementById('fixedSizeSvg');
  if (!fixedSizeSvg.querySelector('#presprayArea')) {
    presprayAreaBlock = document.createElementNS(NS.SVG, 'image') as unknown as SVGImageElement;
    presprayAreaBlock.setAttribute('id', 'presprayArea');
    presprayAreaBlock.setAttribute('x', '4000');
    presprayAreaBlock.setAttribute('y', '2400');
    presprayAreaBlock.setAttribute('width', areaWidth.toFixed(0));
    presprayAreaBlock.setAttribute('height', areaHeight.toFixed(0));
    presprayAreaBlock.setAttribute('href', presprayIconUrl);
    presprayAreaBlock.setAttribute('style', 'cursor:move;');
    const presprayAreaTitle = document.createElementNS(NS.SVG, 'title');
    presprayAreaTitle.textContent = i18n.lang.editor.prespray_area;
    presprayAreaBlock.appendChild(presprayAreaTitle);
    fixedSizeSvg?.appendChild(presprayAreaBlock);
    togglePresprayArea();
  }
};

const checkMouseTarget = (mouseTarget: Element): boolean =>
  mouseTarget && mouseTarget.id === 'presprayArea';

let startX = 0;
let startY = 0;
let workareaSize = { w: 0, h: 0 };

const startDrag = (): void => {
  const { x, y } = getPosition();
  startX = x;
  startY = y;
  const { width, height, expansion } = workareaManager;
  workareaSize = {
    w: width,
    h: height - expansion[1],
  };
};

const drag = (dx: number, dy: number): void => {
  requestAnimationFrame(() => {
    const { w, h } = workareaSize;
    const newX = Math.min(Math.max(0, startX + dx), w - areaWidth);
    const newY = Math.min(Math.max(0, startY + dy), h - areaHeight);
    presprayAreaBlock?.setAttribute('x', newX.toFixed(0));
    presprayAreaBlock?.setAttribute('y', newY.toFixed(0));
  });
};

const endDrag = (): void => {
  if (presprayAreaBlock) {
    const cmd = new history.ChangeElementCommand(
      presprayAreaBlock,
      { x: startX, y: startY },
      'Drag Prespray Area'
    );
    undoManager.addCommandToHistory(cmd);
  }
};

export default {
  checkMouseTarget,
  drag,
  generatePresprayArea,
  getPosition,
  startDrag,
  togglePresprayArea,
  endDrag,
};
