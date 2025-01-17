import NS from 'app/constants/namespaces';

import workareaManager from 'app/svgedit/workarea';
import { getSupportInfo } from 'app/constants/add-on';

import BeamboxPreference from './beambox-preference';
import Constant from './constant';

let openBottomBoundaryRect: SVGRectElement;
let openBottomBoundarySVG: SVGSVGElement;

const createBoundary = async () => {
  openBottomBoundarySVG = document.createElementNS(NS.SVG, 'svg') as unknown as SVGSVGElement;
  openBottomBoundaryRect = document.createElementNS(NS.SVG, 'rect') as unknown as SVGRectElement;
  const canvasBackground = document.getElementById('canvasBackground');
  canvasBackground.appendChild(openBottomBoundarySVG);
  openBottomBoundarySVG.appendChild(openBottomBoundaryRect);
  openBottomBoundarySVG.id = 'open-bottom-boundary';
  openBottomBoundarySVG.setAttribute('width', '100%');
  openBottomBoundarySVG.setAttribute('height', '100%');
  const { width, height } = workareaManager;

  openBottomBoundarySVG.setAttribute('viewBox', `0 0 ${width} ${height}`);
  openBottomBoundarySVG.setAttribute('x', '0');
  openBottomBoundarySVG.setAttribute('y', '0');
  openBottomBoundarySVG.setAttribute('style', 'pointer-events:none');
  openBottomBoundaryRect.setAttribute('fill', '#CCC');
  openBottomBoundaryRect.setAttribute('fill-opacity', '0.4');
  openBottomBoundaryRect.setAttribute('fill-rule', 'evenodd');
  openBottomBoundaryRect.setAttribute('stroke', 'none');
  openBottomBoundaryRect.setAttribute('style', 'pointer-events:none');
  openBottomBoundaryRect.setAttribute('y', '0');
  openBottomBoundaryRect.setAttribute(
    'width',
    `${Constant.borderless.safeDistance.X * Constant.dpmm}`
  );
  openBottomBoundaryRect.setAttribute('height', '100%');
};

const show = async () => {
  if (!openBottomBoundarySVG) await createBoundary();
  const { width } = workareaManager;
  const x = width - Constant.borderless.safeDistance.X * Constant.dpmm;
  openBottomBoundaryRect.setAttribute('x', x.toString());
  openBottomBoundaryRect.setAttribute('display', 'block');
};
const hide = () => {
  if (!openBottomBoundaryRect) return;
  openBottomBoundaryRect.setAttribute('display', 'none');
};

const update = (): void => {
  const isOpenBottom = BeamboxPreference.read('borderless');
  const supportOpenBottom = getSupportInfo(BeamboxPreference.read('workarea')).openBottom;
  if (isOpenBottom && supportOpenBottom) show();
  else hide();
};

export default {
  update,
};
