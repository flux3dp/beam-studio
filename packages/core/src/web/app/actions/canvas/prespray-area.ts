import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import constant from '@core/app/actions/beambox/constant';
import { getAddOnInfo } from '@core/app/constants/addOn';
import { printingModules } from '@core/app/constants/layer-module/layer-modules';
import NS from '@core/app/constants/namespaces';
import presprayIconUrl from '@core/app/icons/prespray.svg?url';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import workareaManager from '@core/app/svgedit/workarea';
import i18n from '@core/helpers/i18n';

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
    document.querySelectorAll(
      Array.from(printingModules)
        .map((module) => `g.layer[data-module="${module}"]:not([display="none"])`)
        .join(', '),
    ).length > 0;

  const rotaryMode = beamboxPreference.read('rotary_mode');
  const hasJobOrigin = beamboxPreference.read('enable-job-origin') && getAddOnInfo(model).jobOrigin;

  if (shouldShow && !(rotaryMode && !hasJobOrigin)) {
    presprayAreaBlock.removeAttribute('display');
  } else {
    presprayAreaBlock.setAttribute('display', 'none');
  }
};

const getPosition = (mm = false): { h: number; w: number; x: number; y: number } => {
  const pxX = Number.parseInt(presprayAreaBlock?.getAttribute('x')!, 10);
  const pxY = Number.parseInt(presprayAreaBlock?.getAttribute('y')!, 10);
  const pxW = areaWidth;
  const pxH = areaHeight;

  if (!mm) {
    return { h: pxH, w: pxW, x: pxX, y: pxY };
  }

  const { dpmm } = constant;

  return {
    h: round(pxH / dpmm, 2),
    w: round(pxW / dpmm, 2),
    x: round(pxX / dpmm, 2),
    y: round(pxY / dpmm, 2),
  };
};

const generatePresprayArea = (): void => {
  const fixedSizeSvg = document.getElementById('fixedSizeSvg');

  if (!fixedSizeSvg!.querySelector('#presprayArea')) {
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

const checkMouseTarget = (mouseTarget: Element): boolean => mouseTarget && mouseTarget.id === 'presprayArea';

let startX = 0;
let startY = 0;
let workareaSize = { h: 0, w: 0 };

const startDrag = (): void => {
  const { x, y } = getPosition();

  startX = x;
  startY = y;

  const { expansion, height, width } = workareaManager;

  workareaSize = {
    h: height - expansion[1],
    w: width,
  };
};

const drag = (dx: number, dy: number): void => {
  requestAnimationFrame(() => {
    const { h, w } = workareaSize;
    const newX = Math.min(Math.max(0, startX + dx), w - areaWidth);
    const newY = Math.min(Math.max(0, startY + dy), h - areaHeight);

    presprayAreaBlock?.setAttribute('x', newX.toFixed(0));
    presprayAreaBlock?.setAttribute('y', newY.toFixed(0));
  });
};

const endDrag = (): void => {
  if (presprayAreaBlock) {
    const cmd = new history.ChangeElementCommand(presprayAreaBlock, { x: startX, y: startY }, 'Drag Prespray Area');

    undoManager.addCommandToHistory(cmd);
  }
};

export default {
  checkMouseTarget,
  drag,
  endDrag,
  generatePresprayArea,
  getPosition,
  startDrag,
  togglePresprayArea,
};
