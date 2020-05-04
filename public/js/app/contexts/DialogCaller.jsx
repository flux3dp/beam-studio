define([
    'jsx!widgets/Modal',
    'jsx!/views/Dialog',
    'jsx!views/beambox/Camera-Calibration',
    'jsx!views/beambox/Diode-Calibration',
    'jsx!views/beambox/Document-Panels/Document-Panel',
    'jsx!views/beambox/Network-Testing-Panel',
    'jsx!views/beambox/Photo-Edit-Panel',
    'jsx!views/beambox/Layer-Color-Config',
    'jsx!views/beambox/Svg-Nest-Buttons',
], function (
    Modal,
    Dialog,
    CameraCalibration,
    DiodeCalibration,
    DocumentPanel,
    NetworkTestingPanel,
    PhotoEditPanel,
    LayerColorConfigPanel,
    SvgNestButtons
) {
    const React = require('react');
    const addDialogComponent = (id, component) => {
        if (!Dialog.DialogContextCaller) {
            console.log('Dialog context not loaded Yet');
        } else {
            Dialog.DialogContextCaller.addDialogComponent(id, component);
        }
    };

    const isIdExist = (id) => {
        if (!Dialog.DialogContextCaller) {
            console.log('Dialog context not loaded Yet');
        } else {
            const isExist = Dialog.DialogContextCaller.isIdExist(id);
            return isExist;
        }
    }

    const popDialogById = (id) => {
        if (!Dialog.DialogContextCaller) {
            console.log('Dialog context not loaded Yet');
        } else {
            Dialog.DialogContextCaller.popDialogById(id);
        }
    };

    return {
        addDialogComponent,
        popDialogById,
        showCameraCalibration: (device, isBorderless) => {
            if (isIdExist('camera-cali')) return;
            addDialogComponent('camera-cali',
                <Modal>
                    <CameraCalibration
                        device={device}
                        model={'beamo'}
                        borderless={isBorderless}
                        onClose={() => {
                            popDialogById('camera-cali')
                        }}
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
                        onClose={() => {
                            popDialogById('diode-cali')
                        }}
                    />
                </Modal>
            );
        },
        showDocumentSettings: () => {
            if (isIdExist('docu-setting')) return;
            addDialogComponent('docu-setting',
                <Modal>
                    <DocumentPanel
                        unmount={() => {
                            popDialogById('docu-setting')
                        }}
                    />
                </Modal>
            );
        },
        showNetworkTestingPanel: (ip) => {
            if (isIdExist('network-test')) return;
            addDialogComponent('network-test',
                <NetworkTestingPanel
                    ip={ip}
                    onClose={() => {
                        popDialogById('network-test')
                    }}
                />
            );
        },
        showPhotoEditPanel: (mode) => {
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
            element = selectedElements[0];
            const src = element.getAttribute('origImage') || element.getAttribute('xlink:href');
            addDialogComponent('photo-edit',
                <PhotoEditPanel
                    mode={mode}
                    element={element}
                    src={src}
                    unmount={() => {
                        popDialogById('photo-edit')
                    }}
                />
            );
        },
        showLayerColorConfig: () => {
            if (isIdExist('layer-color-config')) return;
            addDialogComponent('layer-color-config',
                <LayerColorConfigPanel
                    onClose={() => {
                        popDialogById('layer-color-config')
                    }}
                />
            );
        },
        showSvgNestButtons: () => {
            if (isIdExist('svg-nest')) return;
            addDialogComponent('svg-nest',
                <SvgNestButtons
                    onClose={() => {
                        popDialogById('svg-nest')
                    }}
                />
            );
        }
    }
});