/**
 * Converting pdf file to svg file
 * Using pdf2svg binary: https://github.com/dawbarton/pdf2svg
 * binary for mac is built from makefile with dependencies packed by macpack: https://github.com/chearon/macpack
 */
import * as i18n from './i18n';
import Alert from '../app/actions/alert-caller';
import AlertConstants from '../app/constants/alert-constants';
import Progress from '../app/actions/progress-caller';
import { getSVGAsync } from './svg-editor-helper';
let svgCanvas;
let svgEditor;
getSVGAsync((globalSVG) => { svgCanvas = globalSVG.Canvas; svgEditor = globalSVG.Editor; });

const fs = requireNode('fs');
const path = requireNode('path');
const util = requireNode('util');
const child_process = requireNode('child_process');
const exec = util.promisify(child_process.exec);
const execFile = util.promisify(child_process.execFile);
const resourcesRoot = process['defaultApp'] ? process.cwd() : process['resourcesPath'];
const lang = i18n.lang.beambox.popup.pdf2svg;

const programDataPath = path.join('C:', 'ProgramData');
const beamStudioDataPath = path.join(programDataPath, 'Beam Studio');
const win32TempFile = path.join(beamStudioDataPath, 'temp.pdf');
if (process.platform === 'win32') {
    if (!fs.existsSync(programDataPath)) {
        child_process.execSync(`mkdir "${programDataPath}"`);
    }
    if (!fs.existsSync(beamStudioDataPath)) {
        child_process.execSync(`mkdir "${beamStudioDataPath}"`);
    }
}

let pdf2svgPath = null;
if (process.platform === 'darwin') {
    pdf2svgPath = path.join(resourcesRoot, 'utils', 'pdf2svg', 'pdf2svg');
} else if (process.platform === 'win32') {
    pdf2svgPath = path.join(resourcesRoot, 'utils', 'pdf2svg', 'pdf2svg.exe');
}

const pdf2svg = async (file) => {
    const outPath = path.join(resourcesRoot, 'utils', 'pdf2svg', 'out.svg');
    if (pdf2svgPath) {
        //mac or windows, using packed binary executable
        try {
            let filePath = file.path;
            if (process.platform === 'win32') {
                fs.copyFileSync(file.path, win32TempFile);
                filePath = win32TempFile;
            }
            const {stdout, stderr} = await execFile(pdf2svgPath, [filePath, outPath]);
            if (!stderr) {
                console.log(outPath);
                let resp = await fetch(outPath);
                const blob = await resp.blob();
                blob['name'] = file.name + '.svg';
                blob['lastModifiedDate'] = file.lastModifiedDate;
                svgEditor.importSvg(blob, {
                    skipVersionWarning: true,
                    skipByLayer: true,
                });
            } else {
                throw stderr;
            }
        } catch (e) {
            console.log('Fail to convert pdf 2 svg', e);
            const message = lang.error_when_converting_pdf + '\n' + e.message;
            Progress.popById('loading_image');
            Alert.popUp({
                type: AlertConstants.SHOW_POPUP_ERROR,
                message: message
            });
        }
    } else {
        //Linux 
        const outPath = path.join('/tmp', 'out.svg');
        try {
            await exec('type pdf2svg');
        } catch(e) {
            console.log(e);
            const message = lang.error_pdf2svg_not_found;
            Progress.popById('loading_image');
            Alert.popUp({
                type: AlertConstants.SHOW_POPUP_ERROR,
                message: message
            });
            return;
        }
        try {
            const {stdout, stderr} = await exec(`pdf2svg "${file.path}" "${outPath}"`);
            console.log('out', stdout, 'err', stderr);
            if (!stderr) {
                const resp = await fetch(outPath);
                const blob = await resp.blob();
                blob['name'] = file.name + '.svg';
                blob['lastModifiedDate'] = file.lastModifiedDate;
                svgEditor.importSvg(blob, {
                    skipVersionWarning: true,
                    skipByLayer: true,
                });
            } else {
                throw stderr;
            }
        } catch (e) {
            console.log('Fail to convert pdf 2 svg', e.message);
            const message = lang.error_when_converting_pdf + '\n' + e.message;
            Progress.popById('loading_image');
            Alert.popUp({
                type: AlertConstants.SHOW_POPUP_ERROR,
                message: message
            });
        }
    }
}

export default {
    pdf2svg
};
