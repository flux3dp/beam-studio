define([
    'helpers/api/config',
    'app/actions/beambox/beambox-preference',
], function(
    Config,
    BeamboxPreference
){
    const workareaMap = new Map();
    workareaMap.set('fbm1', [3000, 2100]);
    workareaMap.set('fbb1b', [4000, 3750]);
    workareaMap.set('fbb1p', [6000, 3750]);
    const workarea = workareaMap.get(BeamboxPreference.read('model'));

    return {
        dpmm: 10, //seem not to be used by all people QQ
        dimension: {
            getWidth: () => {
                let model = BeamboxPreference.read('workarea');
                if (model) {
                    return workareaMap.get(model)[0];
                }
                return workarea[0];
            },
            getHeight: () => {
                let model = BeamboxPreference.read('workarea');
                if (model) {
                    return workareaMap.get(model)[1];
                }
                return workarea[1];
            },
        },
        camera: {
            movementSpeed: {
                // limited by firmware
                x: 300 * 60, // mm per minutes
                y: 100 * 60 // mm per minutes
            },
            imgWidth: 640, //pixel
            imgHeight: 280, //pixel
            offsetX_ideal: 20,    //mm
            offsetY_ideal: 30,    //mm
            scaleRatio_ideal: (585 / 720) * 2, // pixel on studio / pixel on beambox machine; 與焦距成正比
            calibrationPicture: {
                centerX: 90, //mm
                centerY: 90, //mm
                size: 25 //mm
            }
        },
        diode: {
            limitX: 50, //mm
            limitY: 10, //mm
            defaultOffsetX: 69, //mm
            defaultOffsetY: 6, //mm
        },
        allowedWorkarea: {
            'laser-b1': ['fbb1p', 'fbb1b', 'fbm1'],
            'fbb1p': ['fbb1p', 'fbb1b', 'fbm1'],
            'fbb1b': ['fbb1b', 'fbm1'],
            'fbm1': ['fbm1']
        }
    };
});
