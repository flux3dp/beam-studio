/**
 * Converting pdf file to svg file
 * Using pdf2svg binary: https://github.com/dawbarton/pdf2svg
 * binary for mac is built from makefile with dependencies packed by macpack: https://github.com/chearon/macpack
 */
import childProcess from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import util from 'util';

import { getOS } from '@core/helpers/getOS';
import i18n from '@core/helpers/i18n';
import type { PdfHelper } from '@core/interfaces/IPdfHelper';

import fileSystem from './fileSystem';

const resourcesRoot = localStorage.getItem('dev-pdf2svg') ? window.process.cwd() : window.process.resourcesPath;
const tempDir = os.tmpdir();

let isInitialized = false;
let pdf2svgPath: string = '';
let tempFilePath: string = '';

const init = async () => {
  isInitialized = true;
  tempFilePath = path.join(tempDir, 'temp.pdf');

  const osName = getOS();

  if (osName === 'MacOS') {
    pdf2svgPath = path.join(resourcesRoot, 'utils', 'pdf2svg', 'pdf2svg');
  } else if (osName === 'Windows') {
    pdf2svgPath = path.join(resourcesRoot, 'utils', 'pdf2svg', 'pdf2svg.exe');
  }
};

const pdfToSvgBlob = async (file: File): Promise<{ blob?: Blob; errorMessage?: string }> => {
  const lang = i18n.lang.beambox.popup.pdf2svg;

  if (!isInitialized) {
    await init();
  }

  const filePath = fileSystem.getPathForFile(file);

  if (pdf2svgPath) {
    const outPath = path.join(tempDir, 'out.svg');

    // mac or windows, using packed binary executable
    try {
      if (!filePath) throw new Error('Failed to load file path');

      fs.copyFileSync(filePath, tempFilePath);

      const execFile = util.promisify(childProcess.execFile);
      const { stderr } = await execFile(pdf2svgPath, [tempFilePath, outPath], {
        cwd: path.join(resourcesRoot, 'utils', 'pdf2svg'),
      });

      if (!stderr) {
        console.log(outPath);

        const resp = await fetch(outPath);
        const blob = await resp.blob();

        return { blob };
      }

      throw new Error(stderr);
    } catch (err: any) {
      console.log('Fail to convert pdf 2 svg', err.message);

      return { errorMessage: `${lang.error_when_converting_pdf}\n${err.message}` };
    }
  } else {
    // Linux
    const exec = util.promisify(childProcess.exec);
    const outPath = path.join(tempDir, 'out.svg');

    try {
      await exec('type pdf2svg');
    } catch (e) {
      console.log(e);

      return { errorMessage: lang.error_pdf2svg_not_found };
    }
    try {
      const { stderr, stdout } = await exec(`pdf2svg "${filePath}" "${outPath}"`);

      console.log('out', stdout, 'err', stderr);

      if (!stderr) {
        const resp = await fetch(outPath);
        const blob = await resp.blob();

        return { blob };
      }

      throw new Error(stderr);
    } catch (e: any) {
      console.log('Fail to convert pdf 2 svg', e.message);

      return { errorMessage: `${lang.error_when_converting_pdf}\n${e.message}` };
    }
  }
};

export const pdfHelper: PdfHelper = { pdfToSvgBlob };
