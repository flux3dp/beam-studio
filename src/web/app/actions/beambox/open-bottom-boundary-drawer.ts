
import Constant from './constant';
import BeamboxPreference from './beambox-preference';
import { getSVGAsync } from '../../../helpers/svg-editor-helper';
let svgCanvas;
let svgedit;
getSVGAsync((globalSVG) => {
    svgCanvas = globalSVG.Canvas;
    svgedit = globalSVG.Edit;
});

let openBottomBoundaryRect, openBottomBoundarySVG;
const createBoundary = () => {
    openBottomBoundarySVG = document.createElementNS(svgedit.NS.SVG, 'svg');
    openBottomBoundaryRect = document.createElementNS(svgedit.NS.SVG, 'rect');
    const canvasBackground = svgedit.utilities.getElem('canvasBackground');
    canvasBackground.appendChild(openBottomBoundarySVG);
    openBottomBoundarySVG.appendChild(openBottomBoundaryRect);
    svgedit.utilities.assignAttributes(openBottomBoundarySVG, {
        'id': 'open-bottom-boundary',
        'width': '100%',
        'height': '100%',
        'viewBox': `0 0 ${Constant.dimension.getWidth()} ${Constant.dimension.getHeight()}`,
        'x': 0,
        'y': 0,
        'style': 'pointer-events:none',
    });
    svgedit.utilities.assignAttributes(openBottomBoundaryRect, {
        'fill': '#CCC',
        'fill-opacity': 0.4,
        'fill-rule': 'evenodd',
        'stroke': 'none',
        'style': 'pointer-events:none',
        'y': 0,
        'width': Constant.borderless.safeDistance.X * Constant.dpmm,
        'height': '100%',
    });
};

const update = () => {
    const isOpenBottom = BeamboxPreference.read('borderless');
    const supportOpenBottom = Constant.addonsSupportList.openBottom.includes(BeamboxPreference.read('workarea'));
    if (isOpenBottom && supportOpenBottom) {
        show();
    } else {
        hide();
    }
};

const show = () => {
    if (!document.getElementById('open-bottom-boundary')) {
        createBoundary();
    }
    const x = Constant.dimension.getWidth() - Constant.borderless.safeDistance.X * Constant.dpmm;
    openBottomBoundaryRect.setAttribute('x', x);
    openBottomBoundaryRect.setAttribute('display', 'block');
};
const hide = () => {
    if (!openBottomBoundaryRect) return;
    openBottomBoundaryRect.setAttribute('display', 'none');
}

export default {
    update,
    show,
    hide
};