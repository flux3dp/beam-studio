/**
 * API image tracer
 * Ref: none
 */

import Websocket from '../websocket';
import BeamboxActions from '../../app/actions/beambox';
import FnWrapper from '../../app/actions/beambox/svgeditor-function-wrapper';
import LaserPanelController from '../../app/actions/beambox/Laser-Panel-Controller';

export default function() {
    var ws = Websocket({
            method: 'push-studio',
            onMessage: (data) => {
                events.onMessage(data);
            },
            onError: (response) => {
                events.onError(response);
            },
            onFatal: (response) => {
                events.onFatal(response);
            }
        }),
        events = {
            onMessage   : (data) => {
                if(data.svg) {
                    FnWrapper.insertSvg(data.svg, 'layer');
                }

                setTimeout(() => {
                    if (data.layerData) {
                        const layerDataJSON = JSON.parse(data.layerData);

                        for (let layerName in layerDataJSON) {
                            const {
                                name,
                                speed,
                                power
                            } = layerDataJSON[layerName];

                            LaserPanelController.funcs.writeSpeed(name, parseInt(speed));
                            LaserPanelController.funcs.writeStrength(name, parseInt(power));
                        }

                        BeamboxActions.updateLaserPanel();
                    }
                }, 50);
            },
            onError     : (response: any) => { console.log('IP_ERROR'); },
            onFatal     : (response: any) => { console.log('FATAL'); },
            onOpen      : (response: any) => { console.log('Open interprocess socket! '); }
        };

    return {
        connection: ws,
    };
};
