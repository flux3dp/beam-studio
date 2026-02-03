import { round } from 'remeda';

import constant from '@core/app/actions/beambox/constant';
import { getAddOnInfo } from '@core/app/constants/addOn';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import NS from '@core/app/constants/namespaces';
import { getSupportedModules } from '@core/app/constants/workarea-constants';
import presprayIconUrl from '@core/app/icons/prespray.svg?url';
import { useDocumentStore } from '@core/app/stores/documentStore';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import workareaManager from '@core/app/svgedit/workarea';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import i18n from '@core/helpers/i18n';
import { hasModuleLayer } from '@core/helpers/layer-module/layer-module-helper';

let presprayAreaImage: SVGImageElement; // For PRINTER mode
let presprayArea4CContainer: SVGGElement; // For PRINTER_4C mode (group with rect + text)
let currentMode: LayerModuleType | null = null;

const areaWidth = 300;
const areaHeight = 300;
const areaWidth4C = 103;

const getPresprayMode = (): LayerModuleType | null => {
  if (
    hasModuleLayer([LayerModule.PRINTER_4C], { checkVisible: true }) &&
    useDocumentStore.getState()['enable-4c-prespray-area']
  ) {
    return LayerModule.PRINTER_4C;
  }

  if (hasModuleLayer([LayerModule.PRINTER], { checkVisible: true })) return LayerModule.PRINTER;

  return null;
};
const canvasEvents = eventEmitterFactory.createEventEmitter('canvas');

const updateDimensions = (): void => {
  const workarea = workareaManager.model;

  if (getSupportedModules(workarea).includes(LayerModule.PRINTER_4C)) {
    if (presprayArea4CContainer) {
      const rect = presprayArea4CContainer.querySelector('rect');
      const text = presprayArea4CContainer.querySelector('text');

      rect?.setAttribute('y', workareaManager.minY.toString());
      rect?.setAttribute('height', workareaManager.height.toString());
      text?.setAttribute('y', (workareaManager.minY + workareaManager.height / 2).toString());
    }
  }
};

canvasEvents.on('canvas-change', updateDimensions);

const constrainPresprayArea = (): void => {
  // Use drag(0, 0) with endDrag to trigger position constraint
  startDrag();
  drag(0, 0);
  // Y constraint for PRINTER_4C
  updateDimensions();
};

canvasEvents.on('boundary-updated', constrainPresprayArea);

const togglePresprayArea = (): void => {
  const { model } = workareaManager;

  currentMode = getPresprayMode();

  const { 'enable-job-origin': enableJobOrigin, rotary_mode: rotaryMode } = useDocumentStore.getState();
  const hasJobOrigin = enableJobOrigin && getAddOnInfo(model).jobOrigin;
  const shouldShow =
    currentMode === LayerModule.PRINTER_4C || (currentMode === LayerModule.PRINTER && !(rotaryMode && !hasJobOrigin));

  // Hide both elements first
  presprayAreaImage?.setAttribute('display', 'none');
  presprayArea4CContainer?.setAttribute('display', 'none');

  if (shouldShow) {
    constrainPresprayArea();

    if (currentMode === LayerModule.PRINTER) presprayAreaImage?.removeAttribute('display');
    else if (currentMode === LayerModule.PRINTER_4C) presprayArea4CContainer?.removeAttribute('display');
  }
};

useDocumentStore.subscribe(
  (state) => [state['enable-4c-prespray-area'], state['enable-job-origin'], state.rotary_mode],
  () => togglePresprayArea(),
);

const getPosition = (mm = false): { h: number; w: number; x: number; y: number } => {
  let [pxX, pxY, pxW, pxH] = [0, 0, 0, 0];

  if (currentMode === LayerModule.PRINTER_4C) {
    const rect = presprayArea4CContainer?.querySelector('rect');

    if (rect) {
      pxX = Number.parseInt(rect.getAttribute('x') ?? '0', 10);
      pxW = areaWidth4C;
    }
  } else if (currentMode === LayerModule.PRINTER) {
    pxX = Number.parseInt(presprayAreaImage?.getAttribute('x') ?? '0', 10);
    pxY = Number.parseInt(presprayAreaImage?.getAttribute('y') ?? '0', 10);
    pxW = areaWidth;
    pxH = areaHeight;
  }

  if (!mm) return { h: pxH, w: pxW, x: pxX, y: pxY };

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

  // Create PRINTER image element
  if (!fixedSizeSvg!.querySelector('#presprayAreaImage')) {
    presprayAreaImage = document.createElementNS(NS.SVG, 'image') as SVGImageElement;
    presprayAreaImage.setAttribute('id', 'presprayAreaImage');
    presprayAreaImage.setAttribute('x', '4000');
    presprayAreaImage.setAttribute('y', '2400');
    presprayAreaImage.setAttribute('width', areaWidth.toString());
    presprayAreaImage.setAttribute('height', areaHeight.toString());
    presprayAreaImage.setAttribute('href', presprayIconUrl);
    presprayAreaImage.setAttribute('style', 'cursor:move;');

    const imageTitle = document.createElementNS(NS.SVG, 'title');

    imageTitle.textContent = i18n.lang.editor.prespray_area;
    presprayAreaImage.appendChild(imageTitle);
    fixedSizeSvg?.appendChild(presprayAreaImage);
  }

  // Create PRINTER_4C rect element
  if (!fixedSizeSvg!.querySelector('#presprayAreaRect')) {
    presprayArea4CContainer = document.createElementNS(NS.SVG, 'g') as SVGGElement;
    presprayArea4CContainer.setAttribute('id', 'presprayAreaRect');
    presprayArea4CContainer.setAttribute('style', 'cursor:move;');

    // Create rectangle
    const rect = document.createElementNS(NS.SVG, 'rect');
    const x = workareaManager.width - areaWidth4C;

    rect.setAttribute('x', x.toString());
    rect.setAttribute('y', workareaManager.minY.toString());
    rect.setAttribute('width', areaWidth4C.toString());
    rect.setAttribute('height', workareaManager.height.toString());
    rect.setAttribute('fill', '#91afdc');
    rect.setAttribute('fill-opacity', '0.5');
    rect.setAttribute('stroke', '#0080c7');
    rect.setAttribute('stroke-width', '2');

    // Create text
    const text = document.createElementNS(NS.SVG, 'text');

    text.setAttribute('x', (x + areaWidth4C / 2).toString());
    text.setAttribute('y', (workareaManager.minY + workareaManager.height / 2).toString());
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('font-size', '72');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('fill', '#0080c7');
    text.style.transformBox = 'fill-box';
    text.style.transformOrigin = 'center';
    text.style.rotate = '90deg';
    text.textContent = i18n.lang.editor.nozzle_refresh_area;

    presprayArea4CContainer.appendChild(rect);
    presprayArea4CContainer.appendChild(text);
    fixedSizeSvg?.appendChild(presprayArea4CContainer);
  }

  togglePresprayArea();
};

const checkMouseTarget = (mouseTarget: Element): boolean => {
  if (!currentMode) return false;

  return Boolean(
    mouseTarget === presprayAreaImage ||
      mouseTarget === presprayArea4CContainer ||
      presprayArea4CContainer?.contains(mouseTarget),
  );
};
let startX = 0;
let startY = 0;

const startDrag = (): void => {
  const { x, y } = getPosition();

  startX = x;
  startY = y;
};

const drag = (dx: number, dy: number): void => {
  requestAnimationFrame(() => {
    const {
      boundary: { maxX, maxY, minX, minY },
    } = workareaManager;

    if (currentMode === LayerModule.PRINTER_4C) {
      // Horizontal movement only for PRINTER_4C
      const newX = Math.min(Math.max(minX, startX + dx), maxX - areaWidth4C);
      const rect = presprayArea4CContainer?.querySelector('rect');
      const text = presprayArea4CContainer?.querySelector('text');

      rect?.setAttribute('x', newX.toFixed(0));
      text?.setAttribute('x', (newX + areaWidth4C / 2).toFixed(0));
    } else {
      // Free movement for PRINTER
      const newX = Math.min(Math.max(minX, startX + dx), maxX - areaWidth);
      const newY = Math.min(Math.max(minY, startY + dy), maxY - areaHeight);

      presprayAreaImage.setAttribute('x', newX.toFixed(0));
      presprayAreaImage.setAttribute('y', newY.toFixed(0));
    }
  });
};

const endDrag = (): void => {
  if (currentMode === LayerModule.PRINTER) {
    const cmd = new history.ChangeElementCommand(presprayAreaImage, { x: startX, y: startY }, 'Drag Prespray Area');

    undoManager.addCommandToHistory(cmd);
  } else if (currentMode === LayerModule.PRINTER_4C) {
    const cmd = new history.BatchCommand('Drag Prespray Area');
    const rect = presprayArea4CContainer?.querySelector('rect');
    const text = presprayArea4CContainer?.querySelector('text');

    if (rect) cmd.addSubCommand(new history.ChangeElementCommand(rect, { x: startX }));

    if (text) {
      cmd.addSubCommand(new history.ChangeElementCommand(text, { x: startX + areaWidth4C / 2 }));
    }

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
