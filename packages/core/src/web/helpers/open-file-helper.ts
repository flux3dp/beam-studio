/**
 * open-file-helper: handle open file with Beam Stuido
 * Sending event to main process to get the file path
 * and then open the file
 */
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import communicator from '@core/implementations/communicator';

let svgEditor;

getSVGAsync((globalSVG) => {
  svgEditor = globalSVG.Editor;
});

const loadOpenFile = async (): Promise<void> => {
  const path = communicator.sendSync('GET_OPEN_FILE');

  if (path) {
    const fetchPath = path.replace(/#/g, '%23');
    const resp = await fetch(fetchPath);
    const fileBlob = await resp.blob();
    const file = new File([fileBlob], path, { type: fileBlob.type });

    svgEditor.handleFile(file);
  }
};

export default {
  loadOpenFile,
};
