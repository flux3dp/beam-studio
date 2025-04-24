/* eslint-disable reactRefresh/only-export-components */
import type { IIcon } from '@core/interfaces/INoun-Project';

export type MainType = 'animals' | 'basic' | 'decor' | 'holidays' | 'nature' | 'people' | 'tools';
export type SubType =
  | 'arrow'
  | 'avatar'
  | 'birds'
  | 'celebration'
  | 'circular'
  | 'cleaning_tools'
  | 'CNY'
  | 'corner'
  | 'doctor'
  | 'easter'
  | 'elements'
  | 'environment'
  | 'gardening_tools'
  | 'graphics'
  | 'halloween'
  | 'hammer_wrench'
  | 'kitchen_tools'
  | 'label'
  | 'land'
  | 'line'
  | 'photo'
  | 'plants'
  | 'police'
  | 'ribbon'
  | 'sea'
  | 'shape'
  | 'speech'
  | 'student'
  | 'study_tools'
  | 'teacher'
  | 'text'
  | 'valentines'
  | 'weather'
  | 'Xmas';

export const builtInElements: {
  [key: string]: {
    attr: { [key: string]: any };
    element: string;
  };
} = {
  'icon-circle': {
    attr: {
      cx: 250,
      cy: 250,
      'data-ratiofixed': true,
      fill: '#5B5B5B',
      rx: 250,
      ry: 250,
    },
    element: 'ellipse',
  },
  'icon-hexagon': {
    attr: {
      cx: 250,
      cy: 216.5,
      'data-ratiofixed': true,
      edge: 250,
      fill: '#5B5B5B',
      orient: 'x',
      points: ['500,216.5', '375,433.006', '125,433.006', '0,216.5', '125,-0.006', '375,-0.006', '500,216.5'],
      shape: 'regularPoly',
      sides: 6,
    },
    element: 'polygon',
  },
  'icon-octagon': {
    attr: {
      angle_offset: -Math.PI / 8,
      cx: 250,
      cy: 250,
      'data-ratiofixed': true,
      edge: 207.1,
      fill: '#5B5B5B',
      orient: 'x',
      points: [
        '499.9836426,146.4499969',
        '499.9836426,353.5499878',
        '353.541748,499.9918213',
        '146.4418945,499.9918213',
        '0,353.5499878',
        '0,146.4499969',
        '146.4418945,0.0081856',
        '353.541748,0.0081856',
        '499.9836426,146.4499969',
      ],
      shape: 'regularPoly',
      sides: 8,
    },
    element: 'polygon',
  },
  'icon-pentagon': {
    attr: {
      angle_offset: -Math.PI / 2,
      cx: 250,
      cy: 262.851,
      'data-ratiofixed': true,
      edge: 309,
      fill: '#5B5B5B',
      orient: 'x',
      points: ['250,0', '499.986,181.626', '404.5,475.502', '95.5,475.502', '0.014,181.626', '250,0'],
      shape: 'regularPoly',
      sides: 5,
    },
    element: 'polygon',
  },
  'icon-square1': {
    attr: {
      'data-ratiofixed': true,
      fill: '#5B5B5B',
      height: 500,
      width: 500,
    },
    element: 'rect',
  },
  'icon-square2': {
    attr: {
      'data-ratiofixed': true,
      fill: '#5B5B5B',
      height: 500,
      rx: 50,
      width: 500,
    },
    element: 'rect',
  },
  'icon-triangle': {
    attr: {
      angle_offset: -Math.PI / 2,
      cx: 250,
      cy: 288.675,
      'data-ratiofixed': true,
      edge: 500,
      fill: '#5B5B5B',
      orient: 'x',
      points: ['250,0', '500,433.013', '0,433.013', '250,0'],
      shape: 'regularPoly',
      sides: 3,
    },
    element: 'polygon',
  },
};

interface IOpt {
  end: number;
  reverseIndex?: number[];
  twoVersion?: boolean;
}

export const generateFileNameArray = (subType: string, opt?: IOpt): string[] => {
  const path: string[] = [];

  if (!opt) {
    return path;
  }

  const { end, reverseIndex = [], twoVersion = false } = opt;

  for (let i = 1; i <= end; i += 1) {
    const isTwoVersion = twoVersion !== reverseIndex.includes(i);

    if (isTwoVersion) {
      path.push(`i_${subType}-${i}a`);
      path.push(`i_${subType}-${i}b`);
    } else {
      path.push(`i_${subType}-${i}`);
    }
  }

  return path;
};

const Elements: {
  [key in MainType]: {
    [key in SubType]?: {
      fileNames?: string[]; // enumerate file names directly
      pinnedNP?: IIcon[]; // pinned noun project icons
      setting?: IOpt; // need to generate file names by generateFileNameArray
    };
  };
} = {
  animals: {
    birds: { setting: { end: 14 } },
    land: { setting: { end: 47 } },
    sea: { setting: { end: 9 } },
  },
  basic: {
    arrow: {
      fileNames: ['icon-chevron', 'icon-navigator', 'icon-arrow1', 'icon-arrow2', 'icon-arrow3', 'icon-doubleArrow'],
    },
    graphics: {
      fileNames: [
        'icon-star1',
        'icon-star2',
        'icon-star3',
        'icon-star4',
        'icon-heart1',
        'icon-heart2',
        'icon-heart3',
        'icon-heart4',
        'icon-scallopCircle1',
        'icon-scallopCircle2',
        'icon-drop',
        'icon-diamond',
        'icon-sparkle',
        'icon-crescent1',
        'icon-crescent2',
        'icon-check',
        'icon-sun',
        'icon-lightning',
        'icon-cloud',
        'icon-plus',
        'icon-minus',
        'icon-multiply',
        'icon-divide',
        'icon-equal',
      ],
    },
    label: {
      fileNames: [
        'icon-ribbon1',
        'icon-ribbon2',
        'icon-wave',
        'icon-label1',
        'icon-label2',
        'icon-label3',
        'icon-ticket',
      ],
    },
    shape: {
      fileNames: [
        'icon-circle',
        'icon-triangle',
        'icon-square1',
        'icon-square2',
        'icon-pentagon',
        'icon-hexagon',
        'icon-octagon',
        'icon-semicircle',
        'icon-quadrant',
        'icon-sector',
        'icon-parallelogram',
        'icon-trapezoid',
        'icon-ring',
        'icon-tablet',
        'icon-capsule',
        'icon-arch',
      ],
    },
  },
  decor: {
    circular: { setting: { end: 12 } },
    corner: { setting: { end: 10 } },
    line: { setting: { end: 6, reverseIndex: [1, 2] } },
    photo: { setting: { end: 4, twoVersion: true } },
    ribbon: { setting: { end: 8, twoVersion: true } },
    speech: { setting: { end: 8, twoVersion: true } },
    text: { setting: { end: 15, twoVersion: true } },
  },
  holidays: {
    celebration: {
      setting: { end: 20, reverseIndex: [6, 7, 10, 11, 15, 16, 17, 18], twoVersion: true },
    },
    CNY: { setting: { end: 10, reverseIndex: [3, 4, 9, 10], twoVersion: true } },
    easter: { setting: { end: 2, twoVersion: true } },
    halloween: { setting: { end: 13, reverseIndex: [8, 9], twoVersion: true } },
    valentines: { setting: { end: 8, twoVersion: true } },
    Xmas: { setting: { end: 15, reverseIndex: [11, 12], twoVersion: true } },
  },
  nature: {
    elements: { setting: { end: 8 } },
    environment: { setting: { end: 19 } },
    plants: { setting: { end: 29 } },
    weather: { setting: { end: 14 } },
  },
  people: {
    avatar: {
      pinnedNP: [
        { id: '3592562', thumbnail_url: 'https://static.thenounproject.com/png/3592562-200.png' },
        { id: '3592561', thumbnail_url: 'https://static.thenounproject.com/png/3592561-200.png' },
        { id: '3592560', thumbnail_url: 'https://static.thenounproject.com/png/3592560-200.png' },
        { id: '3592559', thumbnail_url: 'https://static.thenounproject.com/png/3592559-200.png' },
        { id: '3592558', thumbnail_url: 'https://static.thenounproject.com/png/3592558-200.png' },
        { id: '6523630', thumbnail_url: 'https://static.thenounproject.com/png/6523630-200.png' },
        { id: '6523622', thumbnail_url: 'https://static.thenounproject.com/png/6523622-200.png' },
        { id: '5839320', thumbnail_url: 'https://static.thenounproject.com/png/5839320-200.png' },
        { id: '5839318', thumbnail_url: 'https://static.thenounproject.com/png/5839318-200.png' },
        { id: '5839317', thumbnail_url: 'https://static.thenounproject.com/png/5839317-200.png' },
        { id: '5839313', thumbnail_url: 'https://static.thenounproject.com/png/5839313-200.png' },
        { id: '4968609', thumbnail_url: 'https://static.thenounproject.com/png/4968609-200.png' },
      ],
    },
    doctor: {
      pinnedNP: [
        { id: '4116116', thumbnail_url: 'https://static.thenounproject.com/png/4116116-200.png' },
        { id: '968761', thumbnail_url: 'https://static.thenounproject.com/png/968761-200.png' },
        { id: '22779', thumbnail_url: 'https://static.thenounproject.com/png/22779-200.png' },
        { id: '7793917', thumbnail_url: 'https://static.thenounproject.com/png/7793917-200.png' },
        { id: '7665964', thumbnail_url: 'https://static.thenounproject.com/png/7665964-200.png' },
        { id: '7015784', thumbnail_url: 'https://static.thenounproject.com/png/7015784-200.png' },
        { id: '7742525', thumbnail_url: 'https://static.thenounproject.com/png/7742525-200.png' },
        { id: '7673227', thumbnail_url: 'https://static.thenounproject.com/png/7673227-200.png' },
        { id: '7673210', thumbnail_url: 'https://static.thenounproject.com/png/7673210-200.png' },
        { id: '7464670', thumbnail_url: 'https://static.thenounproject.com/png/7464670-200.png' },
        { id: '7298436', thumbnail_url: 'https://static.thenounproject.com/png/7298436-200.png' },
        { id: '1983920', thumbnail_url: 'https://static.thenounproject.com/png/1983920-200.png' },
      ],
    },
    police: {
      pinnedNP: [
        { id: '810121', thumbnail_url: 'https://static.thenounproject.com/png/810121-200.png' },
        { id: '7673220', thumbnail_url: 'https://static.thenounproject.com/png/7673220-200.png' },
        { id: '7673208', thumbnail_url: 'https://static.thenounproject.com/png/7673208-200.png' },
        { id: '7437850', thumbnail_url: 'https://static.thenounproject.com/png/7437850-200.png' },
        { id: '7437847', thumbnail_url: 'https://static.thenounproject.com/png/7437847-200.png' },
        { id: '1282231', thumbnail_url: 'https://static.thenounproject.com/png/1282231-200.png' },
        { id: '5237437', thumbnail_url: 'https://static.thenounproject.com/png/5237437-200.png' },
        { id: '5237377', thumbnail_url: 'https://static.thenounproject.com/png/5237377-200.png' },
        { id: '1273697', thumbnail_url: 'https://static.thenounproject.com/png/1273697-200.png' },
        { id: '1273690', thumbnail_url: 'https://static.thenounproject.com/png/1273690-200.png' },
        { id: '7359345', thumbnail_url: 'https://static.thenounproject.com/png/7359345-200.png' },
        { id: '7359344', thumbnail_url: 'https://static.thenounproject.com/png/7359344-200.png' },
      ],
    },
    student: {
      pinnedNP: [
        { id: '7561250', thumbnail_url: 'https://static.thenounproject.com/png/7561250-200.png' },
        { id: '7561214', thumbnail_url: 'https://static.thenounproject.com/png/7561214-200.png' },
        { id: '7536111', thumbnail_url: 'https://static.thenounproject.com/png/7536111-200.png' },
        { id: '7536069', thumbnail_url: 'https://static.thenounproject.com/png/7536069-200.png' },
        { id: '7501432', thumbnail_url: 'https://static.thenounproject.com/png/7501432-200.png' },
        { id: '7489365', thumbnail_url: 'https://static.thenounproject.com/png/7489365-200.png' },
        { id: '7296247', thumbnail_url: 'https://static.thenounproject.com/png/7296247-200.png' },
        { id: '7296219', thumbnail_url: 'https://static.thenounproject.com/png/7296219-200.png' },
        { id: '7403897', thumbnail_url: 'https://static.thenounproject.com/png/7403897-200.png' },
        { id: '295757', thumbnail_url: 'https://static.thenounproject.com/png/295757-200.png' },
        { id: '7749040', thumbnail_url: 'https://static.thenounproject.com/png/7749040-200.png' },
        { id: '7355388', thumbnail_url: 'https://static.thenounproject.com/png/7355388-200.png' },
      ],
    },
    teacher: {
      pinnedNP: [
        { id: '1724991', thumbnail_url: 'https://static.thenounproject.com/png/1724991-200.png' },
        { id: '1971076', thumbnail_url: 'https://static.thenounproject.com/png/1971076-200.png' },
        { id: '7445084', thumbnail_url: 'https://static.thenounproject.com/png/7445084-200.png' },
        { id: '7814211', thumbnail_url: 'https://static.thenounproject.com/png/7814211-200.png' },
        { id: '7791241', thumbnail_url: 'https://static.thenounproject.com/png/7791241-200.png' },
        { id: '7791215', thumbnail_url: 'https://static.thenounproject.com/png/7791215-200.png' },
        { id: '7790445', thumbnail_url: 'https://static.thenounproject.com/png/7790445-200.png' },
        { id: '7731244', thumbnail_url: 'https://static.thenounproject.com/png/7731244-200.png' },
        { id: '7731239', thumbnail_url: 'https://static.thenounproject.com/png/7731239-200.png' },
        { id: '7661648', thumbnail_url: 'https://static.thenounproject.com/png/7661648-200.png' },
        { id: '7561121', thumbnail_url: 'https://static.thenounproject.com/png/7561121-200.png' },
        { id: '7561110', thumbnail_url: 'https://static.thenounproject.com/png/7561110-200.png' },
      ],
    },
  },
  tools: {
    cleaning_tools: {
      pinnedNP: [
        { id: '7767353', thumbnail_url: 'https://static.thenounproject.com/png/7767353-200.png' },
        { id: '7767326', thumbnail_url: 'https://static.thenounproject.com/png/7767326-200.png' },
        { id: '7699336', thumbnail_url: 'https://static.thenounproject.com/png/7699336-200.png' },
        { id: '7650467', thumbnail_url: 'https://static.thenounproject.com/png/7650467-200.png' },
        { id: '7622608', thumbnail_url: 'https://static.thenounproject.com/png/7622608-200.png' },
        { id: '7587175', thumbnail_url: 'https://static.thenounproject.com/png/7587175-200.png' },
        { id: '7316073', thumbnail_url: 'https://static.thenounproject.com/png/7316073-200.png' },
        { id: '7207553', thumbnail_url: 'https://static.thenounproject.com/png/7207553-200.png' },
        { id: '6638779', thumbnail_url: 'https://static.thenounproject.com/png/6638779-200.png' },
        { id: '6638760', thumbnail_url: 'https://static.thenounproject.com/png/6638760-200.png' },
        { id: '6592038', thumbnail_url: 'https://static.thenounproject.com/png/6592038-200.png' },
        { id: '6481747', thumbnail_url: 'https://static.thenounproject.com/png/6481747-200.png' },
      ],
    },
    gardening_tools: {
      pinnedNP: [
        { id: '7773882', thumbnail_url: 'https://static.thenounproject.com/png/7773882-200.png' },
        { id: '7773872', thumbnail_url: 'https://static.thenounproject.com/png/7773872-200.png' },
        { id: '7760265', thumbnail_url: 'https://static.thenounproject.com/png/7760265-200.png' },
        { id: '7598440', thumbnail_url: 'https://static.thenounproject.com/png/7598440-200.png' },
        { id: '7598020', thumbnail_url: 'https://static.thenounproject.com/png/7598020-200.png' },
        { id: '7597976', thumbnail_url: 'https://static.thenounproject.com/png/7597976-200.png' },
        { id: '7559817', thumbnail_url: 'https://static.thenounproject.com/png/7559817-200.png' },
        { id: '7559374', thumbnail_url: 'https://static.thenounproject.com/png/7559374-200.png' },
        { id: '7559356', thumbnail_url: 'https://static.thenounproject.com/png/7559356-200.png' },
        { id: '7559332', thumbnail_url: 'https://static.thenounproject.com/png/7559332-200.png' },
        { id: '7310467', thumbnail_url: 'https://static.thenounproject.com/png/7310467-200.png' },
        { id: '7310446', thumbnail_url: 'https://static.thenounproject.com/png/7310446-200.png' },
      ],
    },
    hammer_wrench: {
      pinnedNP: [
        { id: '6094789', thumbnail_url: 'https://static.thenounproject.com/png/6094789-200.png' },
        { id: '7016436', thumbnail_url: 'https://static.thenounproject.com/png/7016436-200.png' },
        { id: '4747067', thumbnail_url: 'https://static.thenounproject.com/png/4747067-200.png' },
        { id: '4747066', thumbnail_url: 'https://static.thenounproject.com/png/4747066-200.png' },
        { id: '1769900', thumbnail_url: 'https://static.thenounproject.com/png/1769900-200.png' },
        { id: '4428022', thumbnail_url: 'https://static.thenounproject.com/png/4428022-200.png' },
        { id: '4271566', thumbnail_url: 'https://static.thenounproject.com/png/4271566-200.png' },
        { id: '3871454', thumbnail_url: 'https://static.thenounproject.com/png/3871454-200.png' },
        { id: '3646004', thumbnail_url: 'https://static.thenounproject.com/png/3646004-200.png' },
        { id: '3645994', thumbnail_url: 'https://static.thenounproject.com/png/3645994-200.png' },
        { id: '2768591', thumbnail_url: 'https://static.thenounproject.com/png/2768591-200.png' },
        { id: '1400450', thumbnail_url: 'https://static.thenounproject.com/png/1400450-200.png' },
      ],
    },
    kitchen_tools: {
      pinnedNP: [
        { id: '7493424', thumbnail_url: 'https://static.thenounproject.com/png/7493424-200.png' },
        { id: '7283106', thumbnail_url: 'https://static.thenounproject.com/png/7283106-200.png' },
        { id: '7283089', thumbnail_url: 'https://static.thenounproject.com/png/7283089-200.png' },
        { id: '7132654', thumbnail_url: 'https://static.thenounproject.com/png/7132654-200.png' },
        { id: '6983587', thumbnail_url: 'https://static.thenounproject.com/png/6983587-200.png' },
        { id: '6038170', thumbnail_url: 'https://static.thenounproject.com/png/6038170-200.png' },
        { id: '4685858', thumbnail_url: 'https://static.thenounproject.com/png/4685858-200.png' },
        { id: '4537539', thumbnail_url: 'https://static.thenounproject.com/png/4537539-200.png' },
        { id: '3479056', thumbnail_url: 'https://static.thenounproject.com/png/3479056-200.png' },
        { id: '3375242', thumbnail_url: 'https://static.thenounproject.com/png/3375242-200.png' },
        { id: '1178984', thumbnail_url: 'https://static.thenounproject.com/png/1178984-200.png' },
        { id: '2260122', thumbnail_url: 'https://static.thenounproject.com/png/2260122-200.png' },
      ],
    },
    study_tools: {
      pinnedNP: [
        { id: '6774019', thumbnail_url: 'https://static.thenounproject.com/png/6774019-200.png' },
        { id: '6773963', thumbnail_url: 'https://static.thenounproject.com/png/6773963-200.png' },
        { id: '6215716', thumbnail_url: 'https://static.thenounproject.com/png/6215716-200.png' },
        { id: '4555258', thumbnail_url: 'https://static.thenounproject.com/png/4555258-200.png' },
        { id: '3546385', thumbnail_url: 'https://static.thenounproject.com/png/3546385-200.png' },
        { id: '6410973', thumbnail_url: 'https://static.thenounproject.com/png/6410973-200.png' },
        { id: '4082334', thumbnail_url: 'https://static.thenounproject.com/png/4082334-200.png' },
        { id: '1517501', thumbnail_url: 'https://static.thenounproject.com/png/1517501-200.png' },
        { id: '2274044', thumbnail_url: 'https://static.thenounproject.com/png/2274044-200.png' },
        { id: '5347256', thumbnail_url: 'https://static.thenounproject.com/png/5347256-200.png' },
        { id: '7357626', thumbnail_url: 'https://static.thenounproject.com/png/7357626-200.png' },
        { id: '7379920', thumbnail_url: 'https://static.thenounproject.com/png/7379920-200.png' },
      ],
    },
  },
};

export default Elements;

export const MainTypes: MainType[] = ['basic', 'decor', 'animals', 'holidays', 'nature'];

// Only contains Noun Project icons and requires login
export const NPTypes: MainType[] = ['people', 'tools'];

export enum ContentType {
  MainType,
  SubType,
  Search,
}

export const SearchMap: {
  [key: string]: {
    path?: string[];
    types?: Array<[MainType, SubType[]?]>;
  };
} = {
  animal: { types: [['animals']] },
  antelope: { path: ['animals/i_land-20'] },
  arch: { path: ['basic/icon-arch'] },
  arrow: {
    path: ['basic/icon-arrow1', 'basic/icon-arrow2', 'basic/icon-arrow3', 'basic/icon-doubleArrow'],
  },
  ballon: {
    path: [
      'holidays/i_celebration-3a',
      'holidays/i_celebration-3b',
      'holidays/i_celebration-4a',
      'holidays/i_celebration-4b',
    ],
  },
  banner: { types: [['decor', ['ribbon']]] },
  bat: {
    path: ['holidays/i_halloween-5a', 'holidays/i_halloween-5b', 'holidays/i_halloween-6a', 'holidays/i_halloween-6b'],
  },
  beach: { path: ['nature/i_environment-6'] },
  bear: { path: ['animals/i_land-28', 'animals/i_land-45'] },
  beer: { path: ['holidays/i_celebration-5a', 'holidays/i_celebration-5b'] },
  bird: {
    path: ['animals/i_land-24'],
    types: [['animals', ['birds']]],
  },
  border: { types: [['decor', ['corner', 'line']]] },
  branches: {
    path: [
      'decor/i_circular-1',
      'decor/i_circular-2',
      'decor/i_circular-3',
      'decor/i_circular-4',
      'decor/i_circular-5',
      'decor/i_circular-6',
    ],
  },
  bunny: { path: ['animals/i_land-3', 'animals/i_land-4', 'animals/i_land-23', 'animals/i_land-47'] },
  cactus: { path: ['nature/i_plants-5', 'nature/i_plants-26', 'nature/i_plants-29'] },
  cake: { path: ['holidays/i_celebration-11'] },
  calculate: { path: ['basic/icon-divide', 'basic/icon-equal', 'basic/icon-minus', 'basic/icon-plus'] },
  camel: { path: ['animals/i_land-40'] },
  cancel: { path: ['basic/icon-multiply'] },
  capsule: { path: ['basic/icon-capsule'] },
  cat: { path: ['animals/i_land-1', 'animals/i_land-2', 'animals/i_land-11', 'animals/i_land-38'] },
  celebration: { types: [['holidays', ['celebration']]] },
  champagne: { path: ['holidays/i_celebration-7'] },
  check: { path: ['basic/icon-check'] },
  chevron: { path: ['basic/icon-chevron'] },
  chicken: {
    path: ['animals/i_birds-1', 'animals/i_birds-4', 'animals/i_birds-9', 'animals/i_birds-11'],
  },
  christmas: {
    path: ['nature/i_plants-11'],
    types: [['holidays', ['Xmas']]],
  },
  circle: { path: ['basic/icon-circle', 'basic/icon-ring'] },
  circular: { types: [['decor', ['circular']]] },
  cloud: { path: ['basic/icon-cloud', 'nature/i_weather-10', 'nature/i_weather-11'] },
  cold: { path: ['nature/i_weather-1', 'nature/i_weather-2', 'nature/i_weather-3'] },
  corner: { types: [['decor', ['corner']]] },
  cow: { path: ['animals/i_land-12', 'animals/i_land-31', 'animals/i_land-34', 'animals/i_land-46'] },
  crab: { path: ['animals/i_sea-4'] },
  crane: { path: ['animals/i_birds-2'] },
  crescent: { path: ['basic/icon-crescent1', 'basic/icon-crescent2'] },
  crow: { path: ['animals/i_birds-6'] },
  cute: { path: ['animals/i_land-14'] },
  death: {
    path: [
      'holidays/i_halloween-9',
      'holidays/i_halloween-10a',
      'holidays/i_halloween-10b',
      'holidays/i_halloween-11a',
      'holidays/i_halloween-11b',
      'holidays/i_halloween-13a',
      'holidays/i_halloween-13b',
    ],
  },
  decoration: {
    path: ['basic/icon-ribbon1', 'basic/icon-ribbon2', 'holidays/i_Xmas-7a', 'holidays/i_Xmas-7b'],
    types: [['decor']],
  },
  deer: {
    path: ['animals/i_land-6', 'animals/i_land-21', 'animals/i_land-25', 'holidays/i_Xmas-3a', 'holidays/i_Xmas-3b'],
  },
  desert: { path: ['nature/i_environment-5', 'nature/i_environment-12'] },
  diamond: { path: ['basic/icon-diamond', 'holidays/i_valentines-8a', 'holidays/i_valentines-8b'] },
  divide: { path: ['basic/icon-divide'] },
  dog: {
    path: ['animals/i_land-11', 'animals/i_land-14', 'animals/i_land-16', 'animals/i_land-36', 'animals/i_land-37'],
  },
  dolphin: { path: ['animals/i_sea-2'] },
  doublearrow: { path: ['basic/icon-doubleArrow'] },
  drop: { path: ['basic/icon-drop'] },
  duck: { path: ['animals/i_birds-8', 'animals/i_birds-13'] },
  easter: { types: [['holidays', ['easter']]] },
  elements: { types: [['nature', ['elements']]] },
  elephant: { path: ['animals/i_land-44'] },
  environment: { types: [['nature', ['environment']]] },
  equal: { path: ['basic/icon-equal'] },
  farm: {
    path: [
      'nature/i_plants-9',
      'nature/i_plants-10',
      'nature/i_plants-15',
      'nature/i_plants-16',
      'nature/i_plants-20',
      'nature/i_plants-24',
    ],
  },
  father: { path: ['holidays/i_celebration-19a', 'holidays/i_celebration-19b'] },
  fawn: { path: ['animals/i_land-25'] },
  fire: {
    path: [
      'nature/i_elements-4',
      'nature/i_elements-5',
      'nature/i_elements-6',
      'nature/i_elements-7',
      'nature/i_elements-8',
    ],
  },
  firework: {
    path: [
      'holidays/i_celebration-15',
      'holidays/i_celebration-16',
      'holidays/i_celebration-17',
      'holidays/i_celebration-18',
    ],
  },
  fish: { path: ['animals/i_sea-5', 'animals/i_sea-6', 'animals/i_sea-7'] },
  flag: {
    path: [
      'holidays/i_celebration-8a',
      'holidays/i_celebration-8b',
      'holidays/i_celebration-9a',
      'holidays/i_celebration-9b',
    ],
  },
  flower: {
    path: [
      'decor/i_circular-9',
      'decor/i_circular-11',
      'holidays/i_valentines-6a',
      'holidays/i_valentines-6b',
      'holidays/i_valentines-7a',
      'holidays/i_valentines-7b',
      'nature/i_plants-9',
      'nature/i_plants-10',
      'nature/i_plants-14',
      'nature/i_plants-15',
      'nature/i_plants-16',
      'nature/i_plants-24',
    ],
  },
  footprint: { path: ['animals/i_land-16'] },
  forest: {
    path: [
      'nature/i_environment-4',
      'nature/i_environment-13',
      'nature/i_plants-18',
      'nature/i_plants-23',
      'nature/i_plants-25',
    ],
  },
  fox: { path: ['animals/i_land-9'] },
  frame: { types: [['decor', ['photo', 'corner', 'text']]] },
  frog: { path: ['animals/i_land-19'] },
  ghost: {
    path: ['holidays/i_halloween-1a', 'holidays/i_halloween-1b', 'holidays/i_halloween-2a', 'holidays/i_halloween-2b'],
  },
  'gingerbread man': { path: ['holidays/i_Xmas-4a', 'holidays/i_Xmas-4b'] },
  giraffe: { path: ['animals/i_land-22'] },
  glass: {
    path: [
      'holidays/i_celebration-1a',
      'holidays/i_celebration-1b',
      'holidays/i_celebration-2a',
      'holidays/i_celebration-2b',
    ],
  },
  goat: { path: ['animals/i_land-13', 'animals/i_land-41'] },
  halloween: { types: [['holidays', ['halloween']]] },
  hat: { path: ['holidays/i_halloween-12a', 'holidays/i_halloween-12b'] },
  heart: {
    path: ['basic/icon-heart1', 'basic/icon-heart2', 'basic/icon-heart3', 'basic/icon-heart4', 'decor/i_circular-12'],
  },
  hexagon: { path: ['basic/icon-hexagon'] },
  holiday: { types: [['holidays']] },
  horse: { path: ['animals/i_land-8', 'animals/i_land-39'] },
  hot: { path: ['nature/i_weather-4', 'nature/i_weather-12'] },
  island: { path: ['nature/i_environment-1'] },
  jellyfish: { path: ['animals/i_sea-9'] },
  juice: { path: ['holidays/i_celebration-6'] },
  kangaroo: { path: ['animals/i_land-7'] },
  kitty: { path: ['animals/i_land-1', 'animals/i_land-2'] },
  koala: { path: ['animals/i_land-5'] },
  label: { path: ['basic/icon-label1', 'basic/icon-label2', 'basic/icon-label3'] },
  leaf: {
    path: [
      'nature/i_plants-1',
      'nature/i_plants-2',
      'nature/i_plants-3',
      'nature/i_plants-6',
      'nature/i_plants-12',
      'nature/i_plants-13',
      'nature/i_plants-17',
      'nature/i_plants-20',
      'nature/i_plants-21',
      'nature/i_plants-22',
      'nature/i_plants-27',
    ],
  },
  leaves: {
    path: [
      'decor/i_circular-10',
      'nature/i_plants-1',
      'nature/i_plants-2',
      'nature/i_plants-3',
      'nature/i_plants-6',
      'nature/i_plants-12',
      'nature/i_plants-13',
      'nature/i_plants-17',
      'nature/i_plants-20',
      'nature/i_plants-27',
    ],
  },
  letter: {
    path: [
      'holidays/i_valentines-1a',
      'holidays/i_valentines-1b',
      'holidays/i_valentines-5a',
      'holidays/i_valentines-5b',
    ],
  },
  lightning: { path: ['basic/icon-lightning', 'nature/i_weather-6', 'nature/i_weather-9'] },
  line: { types: [['decor', ['line']]] },
  lizard: { path: ['animals/i_land-33'] },
  love: {
    path: [
      'basic/icon-heart1',
      'basic/icon-heart2',
      'basic/icon-heart3',
      'basic/icon-heart4',
      'decor/i_circular-12',
      'holidays/i_celebration-19a',
      'holidays/i_celebration-19b',
      'holidays/i_celebration-20a',
      'holidays/i_celebration-20b',
      'holidays/i_valentines-1a',
      'holidays/i_valentines-1b',
      'holidays/i_valentines-2a',
      'holidays/i_valentines-2b',
      'holidays/i_valentines-3a',
      'holidays/i_valentines-3b',
      'holidays/i_valentines-4a',
      'holidays/i_valentines-4b',
      'holidays/i_valentines-5a',
      'holidays/i_valentines-5b',
    ],
  },
  minus: { path: ['basic/icon-minus'] },
  monkey: { path: ['animals/i_land-17'] },
  moon: { path: ['nature/i_weather-7', 'nature/i_weather-8'] },
  mother: { path: ['holidays/i_celebration-20a', 'holidays/i_celebration-20b'] },
  mountain: {
    path: [
      'nature/i_environment-7',
      'nature/i_environment-9',
      'nature/i_environment-14',
      'nature/i_environment-15',
      'nature/i_environment-16',
      'nature/i_environment-17',
    ],
  },
  mouse: { path: ['animals/i_land-18', 'animals/i_land-43'] },
  music: { path: ['holidays/i_celebration-13a', 'holidays/i_celebration-13b'] },
  nature: {
    types: [['nature', ['elements', 'environment']]],
  },
  navigator: { path: ['basic/icon-navigator'] },
  'new year': { types: [['holidays', ['CNY']]] },
  night: { path: ['nature/i_weather-7', 'nature/i_weather-8', 'nature/i_weather-13'] },
  octagon: { path: ['basic/icon-octagon'] },
  octopus: { path: ['animals/i_sea-1'] },
  owl: { path: ['animals/i_birds-10'] },
  palm: {
    path: ['nature/i_plants-4', 'nature/i_plants-7', 'nature/i_plants-19', 'nature/i_plants-28'],
  },
  parallelogram: { path: ['basic/icon-parallelogram'] },
  parrot: { path: ['animals/i_birds-12'] },
  party: {
    path: [
      'holidays/i_celebration-10',
      'holidays/i_celebration-12a',
      'holidays/i_celebration-12b',
      'holidays/i_celebration-14a',
      'holidays/i_celebration-14b',
    ],
  },
  peacock: { path: ['animals/i_birds-14'] },
  penguin: { path: ['animals/i_land-24'] },
  pentagon: { path: ['basic/icon-pentagon'] },
  pet: {
    path: ['animals/i_land-11', 'animals/i_land-14', 'animals/i_land-36', 'animals/i_land-37', 'animals/i_land-38'],
  },
  petal: { path: ['nature/i_plants-6', 'nature/i_plants-14'] },
  photo: { types: [['decor', ['photo']]] },
  pig: { path: ['animals/i_land-10', 'animals/i_land-35', 'animals/i_land-42'] },
  plant: { types: [['nature', ['plants']]] },
  plus: { path: ['basic/icon-plus'] },
  polygon: { path: ['basic/icon-octagon', 'basic/icon-parallelogram', 'basic/icon-pentagon'] },
  'potted plant': { path: ['nature/i_plants-21', 'nature/i_plants-22'] },
  present: {
    path: ['holidays/i_Xmas-14a', 'holidays/i_Xmas-14b', 'holidays/i_Xmas-15a', 'holidays/i_Xmas-15b'],
  },
  pumpkin: {
    path: ['holidays/i_halloween-3a', 'holidays/i_halloween-3b', 'holidays/i_halloween-4a', 'holidays/i_halloween-4b'],
  },
  quadrant: { path: ['basic/icon-quadrant'] },
  rain: { path: ['nature/i_weather-5', 'nature/i_weather-14'] },
  ram: { path: ['animals/i_land-13'] },
  reindeer: { path: ['animals/i_land-6', 'animals/i_land-21'] },
  rhino: { path: ['animals/i_land-27'] },
  ribbon: {
    path: ['basic/icon-ribbon1', 'basic/icon-ribbon2'],
    types: [['decor', ['ribbon']]],
  },
  ring: { path: ['basic/icon-ring', 'holidays/i_valentines-8a', 'holidays/i_valentines-8b'] },
  rose: {
    path: [
      'holidays/i_valentines-6a',
      'holidays/i_valentines-6b',
      'holidays/i_valentines-7a',
      'holidays/i_valentines-7b',
    ],
  },
  santa: {
    path: [
      'holidays/i_Xmas-1a',
      'holidays/i_Xmas-1b',
      'holidays/i_Xmas-2a',
      'holidays/i_Xmas-2b',
      'holidays/i_Xmas-5a',
      'holidays/i_Xmas-5b',
    ],
  },
  'scallop circle': { path: ['basic/icon-scallopCircle1', 'basic/icon-scallopCircle2'] },
  sea: { path: ['nature/i_environment-3'] },
  sector: { path: ['basic/icon-sector'] },
  semicircle: { path: ['basic/icon-semicircle'] },
  serpent: { path: ['animals/i_land-15'] },
  shark: { path: ['animals/i_sea-3'] },
  sheep: { path: ['animals/i_land-32'] },
  shell: { path: ['animals/i_land-29'] },
  shiny: {
    path: ['basic/icon-sparkle', 'basic/icon-star1', 'basic/icon-star2', 'basic/icon-star3', 'basic/icon-star4'],
  },
  skeleton: { path: ['holidays/i_halloween-11a', 'holidays/i_halloween-11b'] },
  sky: { path: ['nature/i_weather-13'] },
  snow: {
    path: [
      'holidays/i_Xmas-11',
      'holidays/i_Xmas-12',
      'nature/i_weather-1',
      'nature/i_weather-2',
      'nature/i_weather-3',
    ],
  },
  'snow man': { path: ['holidays/i_Xmas-13a', 'holidays/i_Xmas-13b'] },
  sparkle: { path: ['basic/icon-sparkle'] },
  speech: { types: [['decor', ['speech']]] },
  spider: {
    path: ['animals/i_land-30', 'holidays/i_halloween-7a', 'holidays/i_halloween-7b', 'holidays/i_halloween-8'],
  },
  square: { path: ['basic/icon-square1', 'basic/icon-square2'] },
  star: {
    path: [
      'basic/icon-sparkle',
      'basic/icon-star1',
      'basic/icon-star2',
      'basic/icon-star3',
      'basic/icon-star4',
      'decor/i_circular-7',
      'decor/i_circular-8',
      'holidays/i_Xmas-6a',
      'holidays/i_Xmas-6b',
    ],
  },
  storm: {
    path: ['nature/i_weather-5', 'nature/i_weather-6', 'nature/i_weather-9', 'nature/i_weather-14'],
  },
  sun: { path: ['basic/icon-sun', 'nature/i_weather-4', 'nature/i_weather-12'] },
  sunny: { path: ['basic/icon-sun'] },
  swallow: { path: ['animals/i_birds-5'] },
  tablet: { path: ['basic/icon-tablet'] },
  text: { types: [['decor', ['text']]] },
  ticket: { path: ['basic/icon-ticket'] },
  trapezoid: { path: ['basic/icon-trapezoid'] },
  tree: {
    path: [
      'animals/i_land-5',
      'holidays/i_Xmas-8a',
      'holidays/i_Xmas-8b',
      'holidays/i_Xmas-9a',
      'holidays/i_Xmas-9b',
      'nature/i_environment-1',
      'nature/i_plants-4',
      'nature/i_plants-7',
      'nature/i_plants-8',
      'nature/i_plants-11',
      'nature/i_plants-18',
      'nature/i_plants-19',
      'nature/i_plants-23',
      'nature/i_plants-25',
      'nature/i_plants-28',
    ],
  },
  triangle: { path: ['basic/icon-triangle'] },
  valentines: { types: [['holidays', ['valentines']]] },
  volcano: { path: ['nature/i_environment-8'] },
  water: { path: ['basic/icon-drop', 'nature/i_weather-5', 'nature/i_weather-14'] },
  wave: { path: ['basic/icon-wave', 'nature/i_environment-11'] },
  weather: { types: [['nature', ['weather']]] },
  whale: { path: ['animals/i_sea-8'] },
  wild: { path: ['nature/i_environment-10'] },
  wind: { path: ['nature/i_environment-19'] },
  wither: { path: ['nature/i_plants-8'] },
  wolf: { path: ['animals/i_land-26'] },
  yak: { path: ['animals/i_land-34'] },
};

export const SearchKeyMap: { [key: string]: string } = {
  alcohol: 'beer',
  animals: 'animal',
  cattle: 'cow',
  chameleon: 'lizard',
  chat: 'speech',
  cloudy: 'cloud',
  cny: 'new year',
  cone: 'sector',
  cursor: 'navigator',
  decoration: 'decor',
  decrease: 'minus',
  delete: 'cancel',
  elements: 'element',
  idea: 'speech',
  increase: 'plus',
  kitten: 'kitty',
  'koala bear': 'koala',
  lamb: 'sheep',
  'lunar new year': 'new year',
  math: 'calculate',
  paw: 'footprint',
  person: 'people',
  pony: 'horse',
  rabbit: 'bunny',
  rainy: 'rain',
  rat: 'mouse',
  reptile: 'lizard',
  rhinoceros: 'rhino',
  rooster: 'chicken',
  'santa claus': 'santa',
  sleep: 'koala',
  snail: 'shell',
  snake: 'serpent',
  summer: 'hot',
  sunny: 'sun',
  tape: 'ribbon',
  thunder: 'lightning',
  wine: 'glass',
  winter: 'cold',
  wool: 'sheep',
  wreath: 'circular',
  x: 'cancel',
  xmas: 'christmas',
};
