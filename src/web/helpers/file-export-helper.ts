import Alert from '../app/actions/alert-caller';
import Progress from '../app/actions/progress-caller';
import BeamFileHelper from './beam-file-helper';
import SymbolMaker from './symbol-maker';
import * as i18n from './i18n';
import { getSVGAsync } from './svg-editor-helper';

let svgCanvas;
getSVGAsync((globalSVG) => {
    svgCanvas = globalSVG.Canvas;
});

const electron = window['electron'];
const LANG = i18n.lang;

const setCurrentFileName = (filePath) => {
    let currentFileName;
    if (process.platform === 'win32') {
        currentFileName = filePath.split('\\');
    } else {
        currentFileName = filePath.split('/');
    }
    currentFileName = currentFileName[currentFileName.length -1];
    currentFileName = currentFileName.slice(0, currentFileName.lastIndexOf('.')).replace(':', "/");
    svgCanvas.setLatestImportFileName(currentFileName);
    svgCanvas.filePath = filePath;
    svgCanvas.updateRecentFiles(filePath);
};

const saveAsFile = async () => {
    svgCanvas.clearSelection();
    const output = svgCanvas.getSvgString();
    const defaultFileName = (svgCanvas.getLatestImportFileName() || 'untitled').replace('/', ':');
    const langFile = LANG.topmenu.file;
    const ImageSource = await svgCanvas.getImageSource();
    const currentFilePath = await BeamFileHelper.getFilePath(langFile.save_scene, langFile.all_files, langFile.scene_files, ['beam'], defaultFileName);
    if (currentFilePath) {
        svgCanvas.currentFilePath = currentFilePath;
        await BeamFileHelper.saveBeam(currentFilePath, output, ImageSource);
        setCurrentFileName(currentFilePath);
        svgCanvas.setHasUnsavedChange(false, false);
        return true;
    } else {
        return false;
    }
};

const saveFile = async () => {
    if (!svgCanvas.currentFilePath) {
        const result = await saveAsFile();
        return result;
    } else {
        svgCanvas.clearSelection();
        const output = svgCanvas.getSvgString();
        const fs = requireNode('fs');
        console.log(svgCanvas.currentFilePath);
        if (svgCanvas.currentFilePath.endsWith('.bvg')) {
            fs.writeFile(svgCanvas.currentFilePath, output, function(err) {
                if (err) {
                    console.log('Save Err', err);
                    return;
                }
                console.log('saved');
            });
            svgCanvas.setHasUnsavedChange(false, false);
            return true;
        } else if (svgCanvas.currentFilePath.endsWith('.beam')) {
            const ImageSource = await svgCanvas.getImageSource();
            await BeamFileHelper.saveBeam(svgCanvas.currentFilePath, output, ImageSource);
            svgCanvas.setHasUnsavedChange(false, false);
            return true;
        }
    }
};

const exportAsBVG = async () => {
    svgCanvas.clearSelection();
    SymbolMaker.switchImageSymbolForAll(false);
    const output = svgCanvas.getSvgString();
    SymbolMaker.switchImageSymbolForAll(true);
    const defaultFileName = (svgCanvas.getLatestImportFileName() || 'untitled').replace('/', ':');
    const langFile = LANG.topmenu.file;
    let currentFilePath = electron.ipc.sendSync('save-dialog', langFile.save_scene, langFile.all_files, langFile.scene_files, ['bvg'], defaultFileName, output, localStorage.getItem('lang'));
    if (currentFilePath) {
        setCurrentFileName(currentFilePath);
        svgCanvas.setHasUnsavedChange(false, false);
        return true;
    } else {
        return false;
    }
};

const exportAsSVG = () => {
    if (!checkExportAsSVG()) {
        return;
    }
    svgCanvas.clearSelection();
    $('g.layer').removeAttr('clip-path');
    SymbolMaker.switchImageSymbolForAll(false);
    const output = svgCanvas.getSvgString();
    $('g.layer').attr('clip-path', 'url(#scene_mask)');
    SymbolMaker.switchImageSymbolForAll(true);
    const defaultFileName = (svgCanvas.getLatestImportFileName() || 'untitled').replace('/', ':');
    const langFile = LANG.topmenu.file;
    electron.ipc.sendSync('save-dialog', langFile.save_svg, langFile.all_files, langFile.svg_files, ['svg'], defaultFileName, output, localStorage.getItem('lang'));
};

const checkExportAsSVG = () => {
    const svgContent = document.getElementById('svgcontent');
    const useElements = svgContent.querySelectorAll('use');
    console.log(useElements);
    for (let i = 0; i < useElements.length; i++) {
        const elem = useElements[i];
        if (elem.getAttribute('data-noun-project') === '1') {
            console.log('Contains noun project');
            Alert.popUp({
                id: 'export-noun-project-svg',
                caption: LANG.noun_project_panel.export_svg_title,
                message: LANG.noun_project_panel.export_svg_warning,
                children: Alert.renderHyperLink(LANG.noun_project_panel.learn_more, LANG.noun_project_panel.export_svg_warning_link),
            });
            return false;
        }
    }
    return true;
};

const exportAsImage = async (type) => {
    svgCanvas.clearSelection();
    SymbolMaker.switchImageSymbolForAll(false);
    const output = svgCanvas.getSvgString();
    SymbolMaker.switchImageSymbolForAll(true);
    const langFile = LANG.topmenu.file;
    Progress.openNonstopProgress({ id: 'export_image', message: langFile.converting });
    const defaultFileName = (svgCanvas.getLatestImportFileName() || 'untitled').replace('/', ':');
    let image = await svgCanvas.svgStringToImage(type, output);
    image = image.replace(/^data:image\/\w+;base64,/, "");
    const buf = Buffer.from(image, 'base64');
    Progress.popById('export_image');
    switch (type) {
        case 'png':
            electron.ipc.sendSync('save-dialog', langFile.save_png, langFile.all_files, langFile.png_files, ['png'], defaultFileName, buf, localStorage.getItem('lang'));
            break;
        case 'jpg':
            electron.ipc.sendSync('save-dialog', langFile.save_jpg, langFile.all_files, langFile.jpg_files, ['jpg'], defaultFileName, buf, localStorage.getItem('lang'));
    }
};

const toggleUnsavedChangedDialog = async () => {
    return new Promise((resolve) => {
        electron.ipc.send('SAVE_DIALOG_POPPED');
        if (!svgCanvas.getHasUnsaveChanged() || location.hash !== '#studio/beambox') {
            resolve(true);
        } else {
            Alert.popById('unsaved_change_dialog');
            Alert.popUp({
                id: 'unsaved_change_dialog',
                message: LANG.beambox.popup.save_unsave_changed,
                buttonLabels: [LANG.alert.save, LANG.alert.dont_save, LANG.alert.cancel],
                callbacks: [
                    async () => {
                        if (await saveFile()) {
                            resolve(true);
                        }
                    },
                    () => {
                        resolve(true);
                    },
                    () => {
                        resolve(false);
                    },
                ],
                primaryButtonIndex: 0
            });
        }
    });
};

export default {
    saveAsFile,
    saveFile,
    exportAsBVG,
    exportAsSVG,
    exportAsImage,
    toggleUnsavedChangedDialog,
}