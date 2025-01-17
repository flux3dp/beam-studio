export interface ColorConfig {
  color: string,
  power: number,
  speed: number,
  repeat: number,
}
export const DefaultColorConfigs: ColorConfig[] = [
  {
    color: '#FF0000', power: 15, speed: 50, repeat: 1,
  },
  {
    color: '#FFFF00', power: 15, speed: 50, repeat: 1,
  },
  {
    color: '#00FF00', power: 15, speed: 50, repeat: 1,
  },
  {
    color: '#00FFFF', power: 15, speed: 50, repeat: 1,
  },
  {
    color: '#0000FF', power: 15, speed: 50, repeat: 1,
  },
  {
    color: '#FF00FF', power: 15, speed: 50, repeat: 1,
  },
  {
    color: '#800000', power: 15, speed: 50, repeat: 1,
  },
  {
    color: '#808000', power: 15, speed: 50, repeat: 1,
  },
  {
    color: '#008000', power: 15, speed: 50, repeat: 1,
  },
  {
    color: '#008080', power: 15, speed: 50, repeat: 1,
  },
  {
    color: '#000080', power: 15, speed: 50, repeat: 1,
  },
  {
    color: '#800080', power: 15, speed: 50, repeat: 1,
  },
  {
    color: '#CCCCCC', power: 15, speed: 50, repeat: 1,
  },
  {
    color: '#808080', power: 15, speed: 50, repeat: 1,
  },
  {
    color: '#000000', power: 15, speed: 50, repeat: 1,
  },
];

const randomLayerColors = [
  '#333333',
  '#3F51B5',
  '#F44336',
  '#FFC107',
  '#8BC34A',
  '#2196F3',
  '#009688',
  '#FF9800',
  '#CDDC39',
  '#00BCD4',
  '#FFEB3B',
  '#E91E63',
  '#673AB7',
  '#03A9F4',
  '#9C27B0',
  '#607D8B',
  '#9E9E9E',
];

export const objectsColorPresets =[
  '#F5222D',
  '#FA8C16',
  '#FADB14',
  '#8BBB11',
  '#52C41A',
  '#13A8A8',
  '#1677FF',
  '#2F54EB',
  '#722ED1',
];

export enum PrintingColors {
  CYAN = '#009FE3',
  MAGENTA = '#E6007E',
  YELLOW = '#FFED00',
  BLACK = '#1D1D1B',
  WHITE = '#E2E2E2',
}

const printingLayerColor = [
  PrintingColors.CYAN,
  PrintingColors.MAGENTA,
  PrintingColors.YELLOW,
  PrintingColors.BLACK,
  PrintingColors.WHITE,
];

export const CMYK = [
  PrintingColors.CYAN,
  PrintingColors.MAGENTA,
  PrintingColors.YELLOW,
  PrintingColors.BLACK,
];

export default {
  randomLayerColors,
  printingLayerColor,
};
