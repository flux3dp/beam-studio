import { IController } from 'interfaces/IBoxgen';

export const SHEET_THICKNESS_MM = [
  { label: '3 mm', value: 3 },
  { label: '5 mm', value: 5 },
  { label: '7 mm', value: 7 },
  { label: '10 mm', value: 10 },
  { label: '12 mm', value: 12 },
];

export const SHEET_THICKNESS_INCH = [
  { label: '1/8 inch', value: 3.175 },
  { label: '1/4 inch', value: 6.35 },
  { label: '3/8 inch', value: 9.525 },
  { label: '1/2 inch', value: 12.7 },
];

export const BOLT_THICK = {
  M2: 1.6,
  'M2.5': 2,
  M3: 2.4,
  'M3.5': 2.8,
  M4: 3.2,
  M5: 4,
  M6: 5,
  M7: 5.5,
  M8: 6.5,
};

export const BOLT_HEX_WIDTH = {
  M2: 4,
  'M2.5': 5,
  M3: 5.5,
  'M3.5': 6,
  M4: 7,
  M5: 8,
  M6: 10,
  M7: 11,
};

export const DEFAULT_STROKE_COLOR = {
  r: 0x00,
  g: 0x00,
  b: 0xff,
};

export const DEFAULT_LABEL_COLOR = {
  r: 0xcc,
  g: 0xcc,
  b: 0xcc,
};

export const SCREW_SIZE_MM = [
  { label: 'M2.5', value: 2.5 },
  { label: 'M3', value: 3 },
  { label: 'M4', value: 4 },
  { label: 'M5', value: 5 },
  { label: 'M6', value: 6 },
];

export const SCREW_SIZE_INCH = [
  { label: '#4', value: 2.7781 },
  { label: '#5', value: 3.175 },
  { label: '#6', value: 3.5719 },
  { label: '#8', value: 3.9688 },
  { label: '#10', value: 4.7625 },
  { label: '1/4 inch', value: 6.35 },
  { label: '3/8 inch', value: 9.525 },
];

export const SCREW_LENGTH_MM = [
  { label: '10 mm', value: 10 },
  { label: '12 mm', value: 12 },
  { label: '16 mm', value: 16 },
  { label: '20 mm', value: 20 },
  { label: '25 mm', value: 25 },
  { label: '30 mm', value: 30 },
];

export const SCREW_LENGTH_INCH = [
  { label: '1 inch', value: 25.4 },
  { label: '3/8 inch', value: 9.525 },
  { label: '1/2 inch', value: 12.7 },
  { label: '5/8 inch', value: 15.875 },
  { label: '3/4 inch', value: 19.05 },
];

export const DEFAULT_CONTROLLER_MM: IController = {
  volume: 'outer',
  cover: true,
  width: 80,
  height: 80,
  depth: 80,
  sheetThickness: 3,
  joint: 'finger',
  teethLength: 40,
  tSlotCount: 0,
  tSlotDiameter: 3,
  tSlotLength: 16,
};

export const DEFAULT_CONTROLLER_INCH: IController = {
  volume: 'outer',
  cover: true,
  width: 76.2,
  height: 76.2,
  depth: 76.2,
  sheetThickness: 3.175,
  joint: 'finger',
  teethLength: 38.1,
  tSlotCount: 0,
  tSlotDiameter: 3.175,
  tSlotLength: 15.875,
};
