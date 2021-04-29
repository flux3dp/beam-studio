import progress from 'app/actions/progress-caller';
import i18n from 'helpers/i18n';
import imageData from 'helpers/image-data';
import jimpHelper from 'helpers/jimp-helper';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { IBatchCommand } from 'interfaces/IHistory';

let svgCanvas;
let svgedit;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
  svgedit = globalSVG.Edit;
});

const getSelectedElem = () => {
  const selectedElements = svgCanvas.getSelectedElems();
  const len = selectedElements.length;
  if (len > 1) {
    return null;
  }
  const element = selectedElements[0] as Element;
  if (element.tagName !== 'image') {
    return null;
  }
  return element;
};

const getImageAttributes = (elem: Element) => {
  const imgUrl = elem.getAttribute('origImage') || elem.getAttribute('xlink:href');
  const shading = elem.getAttribute('data-shading') === 'true';
  let threshold = parseInt(elem.getAttribute('data-threshold'), 10);
  if (Number.isNaN(threshold)) {
    threshold = 128;
  }
  return {
    imgUrl,
    shading,
    threshold,
  };
};

const generateBase64Image = (
  imgSrc: string, shading: boolean, threshold: number,
) => new Promise<string>((resolve) => {
  imageData(imgSrc, {
    grayscale: {
      is_rgba: true,
      is_shading: shading,
      threshold,
      is_svg: false,
    },
    isFullResolution: true,
    onComplete(result) {
      resolve(result.pngBase64);
    },
  });
});

const addBatchCommand = (
  commandName: string, elem: Element, changes: { [key: string]: string|number|boolean },
) => {
  const batchCommand: IBatchCommand = new svgedit.history.BatchCommand(commandName);
  const setAttribute = (key: string, value) => {
    svgCanvas.undoMgr.beginUndoableChange(key, [elem]);
    elem.setAttribute(key, value);
    const cmd = svgCanvas.undoMgr.finishUndoableChange();
    if (!cmd.isEmpty()) {
      batchCommand.addSubCommand(cmd);
    }
  };
  const keys = Object.keys(changes);
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    setAttribute(key, changes[key]);
  }
  if (!batchCommand.isEmpty()) {
    svgCanvas.undoMgr.addCommandToHistory(batchCommand);
  }
  return batchCommand;
};

const colorInvert = async (elem?: Element): Promise<void> => {
  const element = elem || getSelectedElem();
  if (!element) return;
  progress.openNonstopProgress({
    id: 'photo-edit-processing',
    message: i18n.lang.beambox.photo_edit_panel.processing,
  });
  const { imgUrl, shading, threshold } = getImageAttributes(element);
  const newImgUrl = await jimpHelper.colorInvert(imgUrl);
  if (newImgUrl) {
    const newThreshold = shading ? threshold : 256 - threshold;
    const base64Img = await generateBase64Image(newImgUrl, shading, newThreshold);
    addBatchCommand('Image Edit: invert', element, {
      origImage: newImgUrl,
      'data-threshold': newThreshold,
      'xlink:href': base64Img,
    });
    svgCanvas.selectOnly([element], true);
  }
  progress.popById('photo-edit-processing');
};

const generateStampBevel = async (elem?: Element): Promise<void> => {
  const element = elem || getSelectedElem();
  if (!element) return;
  progress.openNonstopProgress({
    id: 'photo-edit-processing',
    message: i18n.lang.beambox.photo_edit_panel.processing,
  });
  const { imgUrl, shading, threshold } = getImageAttributes(element);
  const newImgUrl = await jimpHelper.generateStampBevel(imgUrl, shading ? 128 : threshold);
  if (newImgUrl) {
    const base64Img = await generateBase64Image(newImgUrl, shading, threshold);
    addBatchCommand('Image Edit: bevel', element, {
      origImage: newImgUrl,
      'data-shading': true,
      'data-threshold': 255,
      'xlink:href': base64Img,
    });
    svgCanvas.selectOnly([element], true);
  }
  progress.popById('photo-edit-processing');
};

export default {
  colorInvert,
  generateStampBevel,
};
