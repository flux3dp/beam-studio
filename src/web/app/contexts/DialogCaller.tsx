import Modal from '../widgets/Modal';
import { Dialog, DialogContextHelper } from '../views/dialogs/Dialog';
import Prompt from '../views/dialogs/Prompt';
import ConfirmPrompt from '../views/dialogs/Confirm-Prompt';
import { Tutorial } from '../views/tutorials/Tutorial';
import { ITutorial } from '../../interfaces/ITutorial';
import AboutBeamStudio from '../views/beambox/About-Beam-Studio';
import CameraCalibration from '../views/beambox/Camera-Calibration';
import DiodeCalibration from '../views/beambox/Diode-Calibration';
import DocumentPanel from '../views/beambox/Document-Panels/Document-Panel';
import NetworkTestingPanel from '../views/beambox/Network-Testing-Panel';
import NounProjectPanel from '../views/beambox/Noun-Project-Panel';
import PhotoEditPanel from '../views/beambox/Photo-Edit-Panel';
import LayerColorConfigPanel from '../views/beambox/Layer-Color-Config';
import SvgNestButtons from '../views/beambox/Svg-Nest-Buttons';
import * as i18n from '../../helpers/i18n';
import { getSVGAsync } from '../../helpers/svg-editor-helper';

let svgCanvas;
getSVGAsync((globalSVG) => {
    svgCanvas = globalSVG.Canvas;
});

const React = requireNode('react');
const electronRemote = requireNode('electron').remote;
const { dialog } = electronRemote;
const addDialogComponent = (id: string, component) => {
    if (!DialogContextHelper.context) {
        console.log('Dialog context not loaded Yet');
    } else {
        DialogContextHelper.context.addDialogComponent(id, component);
    }
};

const isIdExist = (id: string) => {
    if (!DialogContextHelper.context) {
        console.log('Dialog context not loaded Yet');
    } else {
        const isExist = DialogContextHelper.context.isIdExist(id);
        return isExist;
    }
}

const popDialogById = (id: string) => {
    if (!DialogContextHelper.context) {
        console.log('Dialog context not loaded Yet');
    } else {
        DialogContextHelper.context.popDialogById(id);
    }
};

let promptIndex = 0;

export default {
    addDialogComponent,
    popDialogById,
    showAboutBeamStudio: () => {
        if (isIdExist('about-bs')) return;
        addDialogComponent('about-bs',
            <AboutBeamStudio
                onClose={() => popDialogById('about-bs')}
            />
        );
    },
    showCameraCalibration: (device, isBorderless: boolean) => {
        if (isIdExist('camera-cali')) return;
        addDialogComponent('camera-cali',
            <Modal>
                <CameraCalibration
                    device={device}
                    model={'beamo'}
                    borderless={isBorderless}
                    onClose={() => popDialogById('camera-cali')}
                />
            </Modal>
        );
    },
    showDiodeCalibration: (device) => {
        if (isIdExist('diode-cali')) return;
        addDialogComponent('diode-cali',
            <Modal>
                <DiodeCalibration
                    device={device}
                    model={'beamo'}
                    onClose={() => popDialogById('diode-cali')}
                />
            </Modal>
        );
    },
    showDocumentSettings: () => {
        if (isIdExist('docu-setting')) return;
        const unmount = () => {popDialogById('docu-setting')};
        addDialogComponent('docu-setting',
            <Modal>
                <DocumentPanel
                    unmount={unmount}
                />
            </Modal>
        );
    },
    showNetworkTestingPanel: (ip?: string) => {
        if (isIdExist('network-test')) return;
        addDialogComponent('network-test',
            <NetworkTestingPanel
                ip={ip}
                onClose={() => popDialogById('network-test')}
            />
        );
    },
    showNounProjectPanel: () => {
        if (isIdExist('noun-project')) return;
        addDialogComponent('noun-project',
            <NounProjectPanel
                onClose={() => popDialogById('noun-project')}
            />
        );
    },
    showPhotoEditPanel: (mode: string) => {
        if (isIdExist('photo-edit')) return;
        const selectedElements = svgCanvas.getSelectedElems();
        let len = selectedElements.length;
        for (let i = 0; i < selectedElements.length; ++i) {
            if (!selectedElements[i]) {
                len = i;
                break;
            }
        }
        if (len > 1) {
            return;
        }
        const element = selectedElements[0];
        const src = element.getAttribute('origImage') || element.getAttribute('xlink:href');
        addDialogComponent('photo-edit',
            <PhotoEditPanel
                mode={mode}
                element={element}
                src={src}
                unmount={() => popDialogById('photo-edit')}
            />
        );
    },
    showLayerColorConfig: () => {
        if (isIdExist('layer-color-config')) return;
        addDialogComponent('layer-color-config',
            <LayerColorConfigPanel
                onClose={() => popDialogById('layer-color-config')}
            />
        );
    },
    showSvgNestButtons: () => {
        if (isIdExist('svg-nest')) return;
        addDialogComponent('svg-nest',
            <SvgNestButtons
                onClose={() => popDialogById('svg-nest')}
            />
        );
    },
    showTutorial: (tutorial: ITutorial, callback) => {
        const { id } = tutorial;
        if (isIdExist(id)) return;
        svgCanvas.clearSelection();
        addDialogComponent(id,
            <Tutorial
                {...tutorial}
                onClose={() => {
                    popDialogById(id);
                    callback();
                }}
            />
        );
    },
    promptDialog: (args) => {
        const id = `prompt-${promptIndex}`;
        promptIndex = (promptIndex + 1) % 10000;
        addDialogComponent(id,
            <Prompt
                {...args}
                onClose={() => popDialogById(id)}
            />
        );
    },
    showConfirmPromptDialog: async (args) => {
        return await new Promise((resolve) => {
            const id = `prompt-${promptIndex}`;
            promptIndex = (promptIndex + 1) % 10000;
            addDialogComponent(id,
                <ConfirmPrompt
                    caption={args.caption}
                    message={args.message}
                    confirmValue={args.confirmValue}
                    onConfirmed={() => resolve(true)}
                    onCanceled={() => resolve(false)}
                    onClose={() => popDialogById(id)}
                />
            );
        })
    },
}