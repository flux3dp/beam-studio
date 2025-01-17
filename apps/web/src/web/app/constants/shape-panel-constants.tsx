/* eslint-disable @typescript-eslint/no-explicit-any */
export const builtInElements: {
  [key: string]: {
    element: string;
    attr: { [key: string]: any };
  };
} = {
  'icon-circle': {
    element: 'ellipse',
    attr: {
      cx: 250,
      cy: 250,
      rx: 250,
      ry: 250,
      'data-ratiofixed': true,
      fill: '#5B5B5B',
    },
  },
  'icon-triangle': {
    element: 'polygon',
    attr: {
      cx: 250,
      cy: 288.675,
      shape: 'regularPoly',
      sides: 3,
      orient: 'x',
      edge: 500,
      angle_offset: -Math.PI / 2,
      points: ['250,0', '500,433.013', '0,433.013', '250,0'],
      'data-ratiofixed': true,
      fill: '#5B5B5B',
    },
  },
  'icon-square1': {
    element: 'rect',
    attr: {
      width: 500,
      height: 500,
      'data-ratiofixed': true,
      fill: '#5B5B5B',
    },
  },
  'icon-square2': {
    element: 'rect',
    attr: {
      width: 500,
      height: 500,
      rx: 50,
      'data-ratiofixed': true,
      fill: '#5B5B5B',
    },
  },
  'icon-pentagon': {
    element: 'polygon',
    attr: {
      cx: 250,
      cy: 262.851,
      shape: 'regularPoly',
      sides: 5,
      orient: 'x',
      edge: 309,
      angle_offset: -Math.PI / 2,
      points: [
        '250,0',
        '499.986,181.626',
        '404.5,475.502',
        '95.5,475.502',
        '0.014,181.626',
        '250,0',
      ],
      'data-ratiofixed': true,
      fill: '#5B5B5B',
    },
  },
  'icon-hexagon': {
    element: 'polygon',
    attr: {
      cx: 250,
      cy: 216.5,
      shape: 'regularPoly',
      sides: 6,
      orient: 'x',
      edge: 250,
      points: [
        '500,216.5',
        '375,433.006',
        '125,433.006',
        '0,216.5',
        '125,-0.006',
        '375,-0.006',
        '500,216.5',
      ],
      'data-ratiofixed': true,
      fill: '#5B5B5B',
    },
  },
  'icon-octagon': {
    element: 'polygon',
    attr: {
      cx: 250,
      cy: 250,
      shape: 'regularPoly',
      sides: 8,
      orient: 'x',
      edge: 207.1,
      angle_offset: -Math.PI / 8,
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
      'data-ratiofixed': true,
      fill: '#5B5B5B',
    },
  },
};

interface IOpt {
  end: number;
  twoVersion?: boolean;
  reverseIndex?: number[];
}

export const generateFileNameArray = (subtype: string, opt?: IOpt): string[] => {
  const path: string[] = [];
  if (!opt) return path;
  const { end, twoVersion = false, reverseIndex = [] } = opt;
  for (let i = 1; i <= end; i += 1) {
    const isTwoVersion = twoVersion !== reverseIndex.includes(i);
    if (isTwoVersion) {
      path.push(`i_${subtype}-${i}a`);
      path.push(`i_${subtype}-${i}b`);
    } else {
      path.push(`i_${subtype}-${i}`);
    }
  }
  return path;
};

const shapes: {
  [key: string]: {
    [key: string]: { fileNames?: string[]; setting?: IOpt };
  };
} = {
  basic: {
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
    arrow: {
      fileNames: [
        'icon-chevron',
        'icon-navigator',
        'icon-arrow1',
        'icon-arrow2',
        'icon-arrow3',
        'icon-doubleArrow',
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
  },
  decor: {
    circular: { setting: { end: 12 } },
    corner: { setting: { end: 10 } },
    photo: { setting: { end: 4, twoVersion: true } },
    line: { setting: { end: 6, reverseIndex: [1, 2] } },
    ribbon: { setting: { end: 8, twoVersion: true } },
    speech: { setting: { end: 8, twoVersion: true } },
    text: { setting: { end: 15, twoVersion: true } },
  },
  animals: {
    land: { setting: { end: 47 } },
    birds: { setting: { end: 14 } },
    sea: { setting: { end: 9 } },
  },
  holidays: {
    celebration: {
      setting: { end: 20, twoVersion: true, reverseIndex: [6, 7, 10, 11, 15, 16, 17, 18] },
    },
    valentines: { setting: { end: 8, twoVersion: true } },
    CNY: { setting: { end: 10, twoVersion: true, reverseIndex: [3, 4, 9, 10] } },
    easter: { setting: { end: 2, twoVersion: true } },
    halloween: { setting: { end: 13, twoVersion: true, reverseIndex: [8, 9] } },
    Xmas: { setting: { end: 15, twoVersion: true, reverseIndex: [11, 12] } },
  },
  nature: {
    plants: { setting: { end: 29 } },
    environment: { setting: { end: 19 } },
    weather: { setting: { end: 14 } },
    elements: { setting: { end: 8 } },
  },
};

export default shapes;

export const ShapeTabs = ['basic', 'decor', 'animals', 'holidays', 'nature'];
