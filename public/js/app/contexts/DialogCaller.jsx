define([
    'jsx!widgets/Modal',
    'jsx!/views/Dialog',
    'jsx!views/beambox/Diode-Calibration',
    'jsx!views/beambox/Network-Testing-Panel',
], function (
    Modal,
    Dialog,
    DiodeCalibration,
    NetworkTestingPanel
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
        }
    }
});