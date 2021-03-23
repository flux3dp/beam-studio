import Modal from 'app/widgets/Modal';
import InputLightBox from 'app/widgets/Input-Lightbox';
import ChangeLogDialog from 'app/views/dialogs/Change-Log';
import ConfirmPrompt from 'app/views/dialogs/Confirm-Prompt';
import { Dialog, DialogContextHelper } from 'app/views/dialogs/Dialog';
import Prompt from 'app/views/dialogs/Prompt';
import AboutBeamStudio from 'app/views/beambox/About-Beam-Studio';
import DocumentPanel from 'app/views/beambox/Document-Panels/Document-Panel';
import DxfDpiSelector from 'app/views/beambox/DxfDpiSelector';
import LayerColorConfigPanel from 'app/views/beambox/Layer-Color-Config';
import NetworkTestingPanel from 'app/views/beambox/Network-Testing-Panel';
import NounProjectPanel from 'app/views/beambox/Noun-Project-Panel';
import PhotoEditPanel from 'app/views/beambox/Photo-Edit-Panel';
import SvgNestButtons from 'app/views/beambox/Svg-Nest-Buttons';
import { Tutorial } from 'app/views/tutorials/Tutorial';
import { ITutorial } from 'interfaces/ITutorial';
import * as i18n from 'helpers/i18n';
import { getSVGAsync } from 'helpers/svg-editor-helper';

let svgCanvas;
getSVGAsync((globalSVG) => {
    svgCanvas = globalSVG.Canvas;
});

const React = requireNode('react');
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
    isIdExist,
    popDialogById,
    showAboutBeamStudio: () => {
        if (isIdExist('about-bs')) return;
        addDialogComponent('about-bs',
            <AboutBeamStudio
                onClose={() => popDialogById('about-bs')}
            />
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
    showDxfDpiSelector: (defaultDpiValue: number) => {
        return new Promise<number | null>((resolve, reject) => {
            addDialogComponent('dxf-dpi-select',
                <Modal>
                    <DxfDpiSelector
                        defaultDpiValue={defaultDpiValue}
                        onSubmit={(val: number) => {
                            popDialogById('dxf-dpi-select');
                            resolve(val);
                        }}
                        onCancel={() => {
                            popDialogById('dxf-dpi-select');
                            resolve(null);
                        }}
                    />
                </Modal>
            )
        });
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
    showChangLog: async (args: { callback?: () => void } = {}) => {
        if (isIdExist('change-log')) return;
        const { callback } = args;
        addDialogComponent('change-log',
            <ChangeLogDialog
                onClose={() => {
                    popDialogById('change-log');
                    if (callback) callback();
                }}
            />
        );
    },
    showInputLightbox: (id: string, args) => {
        addDialogComponent(id,
            <InputLightBox
                isOpen={true}
                caption={args.caption}
                type={args.type || 'TEXT_INPUT'}
                inputHeader={args.inputHeader}
                defaultValue={args.defaultValue}
                confirmText={args.confirmText}
                maxLength={args.maxLength}
                onSubmit={(value) => {
                    args.onSubmit(value);
                }}
                onClose={(from: string) => {
                    popDialogById(id);
                    if (from !== 'submit') args.onCancel();
                }}
            />
        );
    },
}
