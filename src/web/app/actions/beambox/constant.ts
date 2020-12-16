import BeamboxPreference from './beambox-preference';

const workareaMap = new Map();
workareaMap.set('fbm1', [3000, 2100]);
workareaMap.set('fbb1b', [4000, 3750]);
workareaMap.set('fbb1p', [6000, 3750]);
const workarea = workareaMap.get(BeamboxPreference.read('model'));

export default {
    dpmm: 10,
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
    borderless: {
        safeDistance: {
            X: 40, //mm
        }
    },
    diode: {
        limitX: 50, //mm
        limitY: 10, //mm
        defaultOffsetX: 69, //mm
        defaultOffsetY: 6, //mm
        safeDistance: {
            X: 45, //mm
            Y: 15  //mm
        }
    },
    allowedWorkarea: {
        'laser-b1': ['fbb1p', 'fbb1b', 'fbm1'],
        'fbb1p': ['fbb1p', 'fbb1b', 'fbm1'],
        'fbb1b': ['fbb1b', 'fbm1'],
        'fbm1': ['fbm1']
    },
    addonsSupportList: {
        openBottom: ['fbm1'],
        autoFocus: ['fbm1'],
        hybridLaser: ['fbm1'],
    },
    leftPanelWidth: 50, //px
    rightPanelWidth: process.platform !== 'darwin' ? 258 : 242, //px
    rightPanelScrollBarWidth: process.platform !== 'darwin' ? 16 : 0, //px
    sidePanelsWidth: process.platform !== 'darwin' ? 308 : 292, //px
    topBarHeight: process.platform === 'win32' ? 75 : 40, //px
    topBarHeightWithoutTitleBar: 40, //px
    layerListHeight: 240, //px
    rulerWidth: 15, //px
};
