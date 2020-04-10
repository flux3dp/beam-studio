define([
    'jsx!widgets/Modal',
    'jsx!/views/Dialog',
    'jsx!views/beambox/Camera-Calibration',
    'jsx!views/beambox/Diode-Calibration',
    'jsx!views/beambox/Network-Testing-Panel',
    'jsx!views/beambox/Layer-Color-Config',
], function (
    Modal,
    Dialog,
    CameraCalibration,
    DiodeCalibration,
    NetworkTestingPanel,
    LayerColorConfigPanel
) {
    const React = require('react');
    const addDialogComponent = (id, component) => {
        if (!Dialog.DialogContextCaller) {
            console.log('Alert context not loaded Yet');
        } else {
            Dialog.DialogContextCaller.addDialogComponent(id, component);
        }
    };

    const popDialogById = (id) => {
        if (!Dialog.DialogContextCaller) {
            console.log('Alert context not loaded Yet');
        } else {
            Dialog.DialogContextCaller.popDialogById(id);
        }
    };

    return {
        addDialogComponent,
        popDialogById,
        showCameraCalibration: (device, isBorderless) => {
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
        showNetworkTestingPanel: (ip) => {
            addDialogComponent('network-test',
                <NetworkTestingPanel
                    ip={ip}
                    onClose={() => {
                        popDialogById('network-test')
                    }}
                />
            );
        },
        showLayerColorConfig: () => {
            addDialogComponent('layer-color-config',
                <LayerColorConfigPanel
                    onClose={() => {
                        popDialogById('layer-color-config')
                    }}
                />
            );
        }
    }
});