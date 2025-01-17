/* eslint-disable no-param-reassign */
import beamboxPreference from 'app/actions/beambox/beambox-preference';
import findDefs from 'app/svgedit/utils/findDef';
import fontHelper from 'helpers/fonts/fontHelper';
import history from 'app/svgedit/history/history';
import ISVGCanvas from 'interfaces/ISVGCanvas';
import NS from 'app/constants/namespaces';
import sanitizeXmlString from 'helpers/sanitize-xml-string';
import selector from 'app/svgedit/selector';
import updateLayerColor from 'helpers/color/updateLayerColor';
import workareaManager from 'app/svgedit/workarea';
import { getCurrentUser } from 'helpers/api/flux-id';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { getWorkarea } from 'app/constants/workarea-constants';
import { IBatchCommand } from 'interfaces/IHistory';
import { WebFont } from 'interfaces/IFont';

let svgedit;
let svgCanvas: ISVGCanvas;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
  svgedit = globalSVG.Edit;
});

const postContentChange = () => {
  const svgContent = document.getElementById('svgcontent');
  svgCanvas.resetCurrentDrawing(svgContent);

  // Used for embeded image for ext-imagelib, can be removed if ext-imagelib is removed
  svgContent.querySelectorAll('image').forEach((image) => {
    const val = svgCanvas.getHref(image);
    if (val) {
      if (val.indexOf('data:') === 0) {
        const m = val.match(/svgedit_url=(.*?);/);
        if (m) {
          const url = decodeURIComponent(m[1]);
          const tempImage = new Image();
          tempImage.onload = () => {
            image.setAttributeNS(NS.XLINK, 'xlink:href', url);
          };
          tempImage.src = url;
        }
      }
      svgCanvas.embedImage(val);
    }
  });

  // If there is svg in svgcontent, not likely for current design
  svgContent.querySelectorAll('svg').forEach((svg) => {
    if (svg.closest('defs')) {
      return;
    }
    svgCanvas.uniquifyElems(svg);
    const { parentElement } = svg;
    if (parentElement.childNodes.length === 1 && parentElement.nodeName === 'g') {
      parentElement.id = parentElement.id || svgCanvas.getNextId();
    } else {
      svgCanvas.groupSvgElem(svg);
    }
  });

  // Check monotype fonts and load font files
  const user = getCurrentUser();
  svgContent.querySelectorAll('text').forEach(async (text) => {
    await fontHelper.getMonotypeFonts();
    const font = fontHelper.findFont({
      postscriptName: text.getAttribute('font-postscript'),
    }) as WebFont;
    const { success } = await fontHelper.applyMonotypeStyle(font, user, true);
    return success;
  });

  if (svgedit.browser.isGecko()) {
    const defs = findDefs();
    svgContent.querySelectorAll('linearGradient, radialGradient, pattern').forEach((elem) => {
      defs.appendChild(elem);
    });
  }

  svgCanvas.convertGradients(svgContent);

  const { pxWidth, pxHeight, pxDisplayHeight } = getWorkarea(beamboxPreference.read('workarea'));
  svgContent.setAttribute('id', 'svgcontent');
  svgContent.setAttribute('overflow', 'visible');
  svgContent.setAttribute('width', pxWidth?.toString());
  svgContent.setAttribute('height', (pxDisplayHeight ?? pxHeight)?.toString());
  svgContent.setAttribute('viewBox', `0 0 ${pxWidth} ${pxDisplayHeight ?? pxHeight}`);

  const drawing = svgCanvas.getCurrentDrawing();
  drawing.identifyLayers();
  const visElemQuery =
    'a,circle,ellipse,foreignObject,g,image,line,path,polygon,polyline,rect,svg,text,tspan,use';
  svgContent.querySelectorAll('g.layer').forEach((layer) => {
    layer.querySelectorAll(visElemQuery).forEach((elem) => {
      if (!elem.id) elem.setAttribute('id', svgCanvas.getNextId());
    });
  });
  // reset transform lists
  svgedit.transformlist.resetListMap();
  svgCanvas.clearSelection();
  svgedit.path.clearData();
  document.querySelector('#svgroot').appendChild(selector.getSelectorManager().selectorParentGroup);

  const layers: SVGGElement[] = Array.from(svgContent.querySelectorAll(':scope > g.layer'));
  layers.forEach((layer) => {
    updateLayerColor(layer);
    const childNodes = Array.from(layer.childNodes);
    while (childNodes.length > 0) {
      const child = childNodes.pop() as Element;
      if (child.tagName !== 'g') {
        child.addEventListener('mouseover', svgCanvas.handleGenerateSensorArea);
        child.addEventListener('mouseleave', svgCanvas.handleGenerateSensorArea);
      } else {
        childNodes.push(...Array.from(child.childNodes));
      }
    }
  });
  workareaManager.resetView();
};

/**
 * setSvgContent: set svg content with xml string
 * @param svgcontentStr The SVG as XML text.
 * @returns {IBatchCommand | null} True if the SVG was set successfully.
 */
const setSvgContent = (svgcontentStr: string): IBatchCommand | null => {
  try {
    const batchCmd = new history.BatchCommand('Set Svg Content');
    svgcontentStr = sanitizeXmlString(svgcontentStr);
    console.log(svgcontentStr);
    const newDoc = svgedit.utilities.text2xml(svgcontentStr);
    svgCanvas.prepareSvg(newDoc);
    const svgContent = svgCanvas.getContentElem();
    const { nextSibling, parentNode } = svgContent;
    svgContent.remove();
    batchCmd.addSubCommand(new history.RemoveElementCommand(svgContent, nextSibling, parentNode));
    const newSvgContent = document.adoptNode(newDoc.documentElement);
    svgCanvas.setContentElem(newSvgContent);
    parentNode.appendChild(newSvgContent);
    batchCmd.addSubCommand(new history.InsertElementCommand(newSvgContent));
    postContentChange();
    batchCmd.onAfter = () => postContentChange();
    return batchCmd;
  } catch (error) {
    console.log('Failed to set svg content', error);
  }
  return null;
};

export default setSvgContent;
