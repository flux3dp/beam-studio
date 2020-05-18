/**
 * Converting pdf file to svg file
 * Using pdf2svg binary: https://github.com/dawbarton/pdf2svg
 * binary for mac is built from makefile with dependencies packed by macpack: https://github.com/chearon/macpack
 */
define([
    'helpers/i18n',
    'app/contexts/AlertCaller',
    'app/constants/alert-constants',
], function(
    i18n,
    Alert,
    AlertConstants
) {
    'use strict';
    const path = require('path');
    const util = require('util');
    const child_process = require('child_process');
    const exec = util.promisify(child_process.exec);
    const execFile = util.promisify(child_process.execFile);
    const resourcesRoot = (true || process.defaultApp) ? process.cwd() : process.resourcesPath;
    const lang = i18n.lang.beambox.popup.pdf2svg;
    let pdf2svgPath = null;
    if (process.platform === 'darwin') {
        pdf2svgPath = path.join(resourcesRoot, 'utils', 'pdf2svg', 'pdf2svg');
    } else if (process.platform === 'win32') {
        pdf2svgPath = path.join(resourcesRoot, 'utils', 'pdf2svg', 'pdf2svg.exe');
    }
    const outPath = path.join(resourcesRoot, 'utils', 'pdf2svg', 'out.svg');

    const pdf2svg = async (file) => {
        console.log(file);
        if (pdf2svgPath) {
            //mac or windows, using packed binary executable
            try {
                const {stdout, stderr} = await execFile(pdf2svgPath, [file.path, outPath]);
                if (!stderr) {
                    console.log(outPath);
                    let data = await fetch(outPath);
                    data = await data.blob();
                    data.name = file.name + '.svg';
                    data.lastModifiedDate = file.lastModifiedDate;
                    svgEditor.importSvg(data);
                } else {
                    throw stderr
                }
            } catch (e) {
                console.log('Fail to convert pdf 2 svg', e);
                const message = lang.error_when_converting_pdf + '\n' + e.message;
                Alert.popUp({
                    type: AlertConstants.SHOW_POPUP_ERROR,
                    message: message
                });
            }
        } else {
            //Linux 
            try {
                await exec('type pdf2svg');
            } catch(e) {
                console.log(e);
                const message = lang.error_pdf2svg_not_found;
                Alert.popUp({
                    type: AlertConstants.SHOW_POPUP_ERROR,
                    message: message
                });
                return;
            }
            try {
                const {stdout, stderr} = await execFile('pdf2svg', [file.path, outPath]);
                if (!stderr) {
                    console.log(outPath);
                    let data = await fetch(outPath);
                    data = await data.blob();
                    data.name = file.name + '.svg';
                    data.lastModifiedDate = file.lastModifiedDate;
                    svgEditor.importSvg(data);
                } else {
                    throw stderr
                }
            } catch (e) {
                console.log('Fail to convert pdf 2 svg', e.message);
                const message = lang.error_when_converting_pdf + '\n' + e.message;
                Alert.popUp({
                    type: AlertConstants.SHOW_POPUP_ERROR,
                    message: message
                });
            }
        }
    }
    
    return {
        pdf2svg
    }
});