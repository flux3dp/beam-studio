export type WorkAreaLabel = 'beamo' | 'Beambox' | 'Beambox Pro' | 'Beambox2';
export type WorkAreaModel = 'fbm1' | 'fbb1b' | 'fbb1p' | 'fbb2b';

interface WorkArea {
  label: WorkAreaLabel;
  width: number;
  height: number;
}

export const WorkareaMap = new Map<WorkAreaModel, WorkArea>();
WorkareaMap.set('fbm1', {
  label: 'beamo',
  width: 3000,
  height: 2100,
});
WorkareaMap.set('fbb1b', {
  label: 'Beambox',
  width: 4000,
  height: 3750,
});
WorkareaMap.set('fbb1p', {
  label: 'Beambox Pro',
  width: 6000,
  height: 3750,
});
WorkareaMap.set('fbb2b', {
  label: 'Beambox2',
  width: 6100,
  height: 4060,
});

export default {
  dpmm: 10,
  dimension: {
    getWidth: (model: WorkAreaModel): number => WorkareaMap.get(model).width,
    getHeight: (model: WorkAreaModel): number => WorkareaMap.get(model).height,
  },
  camera: {
    movementSpeed: {
      // limited by firmware
      x: 300 * 60, // mm per minutes
      y: 100 * 60, // mm per minutes
    },
    imgWidth: 640, // pixel
    imgHeight: 280, // pixel
    offsetX_ideal: 20, // mm
    offsetY_ideal: 30, // mm
    scaleRatio_ideal: (585 / 720) * 2, // pixel on studio / pixel on beambox machine; 與焦距成正比
    calibrationPicture: {
      centerX: 90, // mm
      centerY: 90, // mm
      size: 25, // mm
    },
  },
  borderless: {
    safeDistance: {
      X: 40, // mm
    },
  },
  diode: {
    limitX: 50, // mm
    limitY: 10, // mm
    defaultOffsetX: 69, // mm
    defaultOffsetY: 6, // mm
    safeDistance: {
      X: 45, // mm
      Y: 15, // mm
    },
  },
  allowedWorkarea: {
    fbb2b: ['fbb2b', 'fbb1p', 'fbb1b', 'fbm1'],
    'laser-b1': ['fbb1p', 'fbb1b', 'fbm1'],
    fbb1p: ['fbb1p', 'fbb1b', 'fbm1'],
    fbb1b: ['fbb1b', 'fbm1'],
    fbm1: ['fbm1'],
  },
  addonsSupportList: {
    openBottom: ['fbm1'],
    autoFocus: ['fbm1', 'fbb2b'],
    hybridLaser: ['fbm1'],
  },
  leftPanelWidth: 50, // px
  rightPanelWidth: process.platform !== 'darwin' ? 258 : 242, // px
  rightPanelScrollBarWidth: process.platform !== 'darwin' ? 16 : 0, // px
  sidePanelsWidth: process.platform !== 'darwin' ? 308 : 292, // px
  topBarHeight: process.platform === 'win32' ? 70 : 40, // px
  topBarHeightWithoutTitleBar: 40, // px
  menuberHeight: process.platform === 'win32' ? 30 : 0, // px
  layerListHeight: 240, // px
  rulerWidth: 15, // px
};
