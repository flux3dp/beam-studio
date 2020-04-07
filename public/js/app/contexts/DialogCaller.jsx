define([
    'jsx!/views/Dialog',
    'jsx!views/beambox/Diode-Calibration',
], function (
    Dialog,
    DiodeCalibration
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
                <DiodeCalibration
                    device={device}
                    model={'beamo'}
                    onClose={() => {
                        popDialogById('diode-cali')
                    }}
                />
            );

        }
    }
});