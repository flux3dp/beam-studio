/* eslint-disable no-console */
/**
 * Converting pdf file to svg file
 * Using pdf2svg binary: https://github.com/dawbarton/pdf2svg
 * binary for mac is built from makefile with dependencies packed by macpack: https://github.com/chearon/macpack
 */
import childProcess from 'child_process';
import fs from 'fs';
import path from 'path';
import util from 'util';
// eslint-disable-next-line import/no-extraneous-dependencies
import { remote } from 'electron';

import i18n from 'helpers/i18n';
import { PdfHelper } from 'interfaces/IPdfHelper';

// eslint-disable-next-line @typescript-eslint/dot-notation
const resourcesRoot = localStorage.getItem('dev') === 'true' ? window.process.cwd() : window.process['resourcesPath'];

let isInited = false;
let pdf2svgPath = null;
let win32TempFile = null;

const init = async () => {
  const appDataPath = remote.app.getPath('appData');
  const beamStudioDataPath = path.join(appDataPath, 'Beam Studio');
  try {
    if (window.os === 'Windows') {
      fs.mkdirSync(beamStudioDataPath, {
        recursive: true,
      });
    }
  } catch (e) {
    console.error('Failed to create pdf beamStudioDataPath');
  }
  isInited = true;
  win32TempFile = path.join(beamStudioDataPath, 'temp.pdf');
  if (window.os === 'MacOS') {
    pdf2svgPath = path.join(resourcesRoot, 'utils', 'pdf2svg', 'pdf2svg');
  } else if (window.os === 'Windows') {
    pdf2svgPath = path.join(resourcesRoot, 'utils', 'pdf2svg', 'pdf2svg.exe');
  }
};

const lang = i18n.lang.beambox.popup.pdf2svg;

const pdfToSvgBlob = async (file: File): Promise<{ blob?: Blob, errorMessage?: string }> => {
  if (!isInited) await init();
  if (pdf2svgPath) {
    const outPath = path.join(resourcesRoot, 'utils', 'pdf2svg', 'out.svg');
    // mac or windows, using packed binary executable
    try {
      let filePath = file.path;
      if (window.os === 'Windows') {
        fs.copyFileSync(file.path, win32TempFile);
        filePath = win32TempFile;
      }
      const execFile = util.promisify(childProcess.execFile);
      const { stderr } = await execFile(pdf2svgPath, [filePath, outPath]);
      if (!stderr) {
        console.log(outPath);
        const resp = await fetch(outPath);
        const blob = await resp.blob();
        return { blob };
      }
      throw Error(stderr);
    } catch (e) {
      console.log('Fail to convert pdf 2 svg', e.message);
      return { errorMessage: `${lang.error_when_converting_pdf}\n${e.message}` };
    }
  } else {
    // Linux
    const exec = util.promisify(childProcess.exec);
    const outPath = path.join('/tmp', 'out.svg');
    try {
      await exec('type pdf2svg');
    } catch (e) {
      console.log(e);
      return { errorMessage: lang.error_pdf2svg_not_found };
    }
    try {
      const { stdout, stderr } = await exec(`pdf2svg "${file.path}" "${outPath}"`);
      console.log('out', stdout, 'err', stderr);
      if (!stderr) {
        const resp = await fetch(outPath);
        const blob = await resp.blob();
        return { blob };
      }
      throw Error(stderr);
    } catch (e) {
      console.log('Fail to convert pdf 2 svg', e.message);
      return { errorMessage: `${lang.error_when_converting_pdf}\n${e.message}` };
    }
  }
};

export default {
  pdfToSvgBlob,
} as PdfHelper;
