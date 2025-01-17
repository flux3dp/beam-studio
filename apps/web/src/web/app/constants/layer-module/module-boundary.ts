import LayerModule from 'app/constants/layer-module/layer-modules';

// Module Boundary for ador
// bottom boundary is added by 20mm for 1064nm laser
const moduleBoundary: {
  [model: number]: { top: number; left: number; bottom: number; right: number };
} = {
  [LayerModule.LASER_10W_DIODE]: { top: 0, left: 0, bottom: 20, right: 0 },
  [LayerModule.LASER_20W_DIODE]: { top: 0, left: 0, bottom: 30, right: 0 },
  [LayerModule.LASER_1064]: { top: 0, left: 0, bottom: 38, right: 0 },
  [LayerModule.PRINTER]: { top: 12.7, left: 0, bottom: 50, right: 0 },
};

export default moduleBoundary;
