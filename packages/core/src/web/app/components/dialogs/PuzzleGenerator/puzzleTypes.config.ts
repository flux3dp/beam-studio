import {
  DEFAULT_BORDER_RADIUS,
  DEFAULT_BORDER_WIDTH,
  DEFAULT_COLUMNS,
  DEFAULT_HEXAGON_ROWS,
  DEFAULT_ORIENTATION,
  DEFAULT_PIECE_SIZE,
  DEFAULT_RADIUS,
  DEFAULT_ROWS,
  DEFAULT_TAB_SIZE,
} from './constants';
import type { ShapeType } from './types';
import type {
  GroupPropertyDef,
  NumberPropertyDef,
  PropertyDef,
  PuzzleState,
  PuzzleTypeConfig,
  SelectPropertyDef,
} from './types';

// TODO: Replace with actual thumbnail imports once assets are added
const circleThumbnail = '';
const rectangleThumbnail = '';
const heartThumbnail = '';
const hexagonThumbnail = '';

const COLUMNS_PROPERTY: NumberPropertyDef = {
  default: DEFAULT_COLUMNS,
  key: 'columns',
  labelKey: 'columns',
  max: 20,
  min: 2,
  step: 1,
  type: 'slider',
};

const ROWS_PROPERTY: NumberPropertyDef = {
  default: DEFAULT_ROWS,
  key: 'rows',
  labelKey: 'rows',
  max: 20,
  min: 2,
  step: 1,
  type: 'slider',
};

const HEXAGON_ROWS_PROPERTY: NumberPropertyDef = {
  default: DEFAULT_HEXAGON_ROWS,
  key: 'rows',
  labelKey: 'rows',
  max: 20,
  min: 2,
  step: 1,
  type: 'slider',
};

const PIECE_SIZE_PROPERTY: NumberPropertyDef = {
  default: DEFAULT_PIECE_SIZE,
  key: 'pieceSize',
  labelKey: 'piece_size',
  max: 100,
  min: 10,
  step: 1,
  type: 'slider',
  unit: 'mm',
};

const TAB_SIZE_PROPERTY: NumberPropertyDef = {
  default: DEFAULT_TAB_SIZE,
  key: 'tabSize',
  labelKey: 'tab_size',
  max: 30,
  min: 0,
  step: 1,
  type: 'slider',
};

const RADIUS_PROPERTY: NumberPropertyDef = {
  default: DEFAULT_RADIUS,
  key: 'radius',
  labelKey: 'radius',
  max: 50,
  min: 0,
  step: 1,
  type: 'slider',
};

const ORIENTATION_PROPERTY: SelectPropertyDef = {
  default: DEFAULT_ORIENTATION,
  key: 'orientation',
  labelKey: 'orientation',
  options: [
    { labelKey: 'orientation_type_1', value: 1 },
    { labelKey: 'orientation_type_2', value: 2 },
    { labelKey: 'orientation_type_3', value: 3 },
    { labelKey: 'orientation_type_4', value: 4 },
  ],
  type: 'select',
};

const imageEnabled = (state: PuzzleState): boolean => state.image.enabled;
const imageUploaded = (state: PuzzleState): boolean => state.image.enabled && state.image.dataUrl !== null;

const createImageGroup = (): GroupPropertyDef => ({
  children: [
    {
      default: false,
      key: 'image.enabled',
      labelKey: 'image',
      type: 'toggle',
    },
    {
      accept: 'image/jpeg,image/png,image/webp',
      condition: imageEnabled,
      key: 'image.upload',
      labelKey: 'upload_image',
      maxResolution: 4000,
      maxSizeMB: 10,
      type: 'image-upload',
    },
    {
      condition: imageUploaded,
      default: 100,
      key: 'image.zoom',
      labelKey: 'zoom',
      max: 400,
      min: 25,
      step: 1,
      type: 'slider',
      unit: '%',
    },
    {
      condition: imageUploaded,
      default: 2,
      key: 'image.bleed',
      labelKey: 'bleed',
      max: 20,
      min: 0,
      step: 0.5,
      type: 'slider',
      unit: 'mm',
    },
    {
      condition: imageUploaded,
      default: 0,
      key: 'image.offsetX',
      labelKey: 'offset_x',
      max: 150,
      min: -150,
      step: 1,
      type: 'slider',
      unit: '%',
    },
    {
      condition: imageUploaded,
      default: 0,
      key: 'image.offsetY',
      labelKey: 'offset_y',
      max: 150,
      min: -150,
      step: 1,
      type: 'slider',
      unit: '%',
    },
    {
      condition: imageUploaded,
      default: 'print',
      key: 'image.exportAs',
      labelKey: 'export_as',
      options: [
        { labelKey: 'export_print', value: 'print' },
        { labelKey: 'export_engrave', value: 'engrave' },
        { labelKey: 'export_none', value: 'none' },
      ],
      type: 'select',
    },
  ],
  enabledBy: 'image.enabled',
  expandable: true,
  key: 'image',
  labelKey: 'image',
  type: 'group',
});

interface BorderGroupOptions {
  includeCornerRadius?: boolean;
}

const createBorderGroup = (options: BorderGroupOptions = {}): GroupPropertyDef => {
  const { includeCornerRadius = false } = options;

  const children: GroupPropertyDef['children'] = [
    {
      default: false,
      key: 'border.enabled',
      labelKey: 'puzzle_board',
      type: 'toggle',
    },
    {
      condition: (state: PuzzleState) => state.border.enabled,
      default: DEFAULT_BORDER_WIDTH,
      key: 'border.width',
      labelKey: 'board_width',
      max: 20,
      min: 1,
      step: 0.5,
      type: 'slider',
      unit: 'mm',
    },
  ];

  if (includeCornerRadius) {
    children.push({
      condition: (state: PuzzleState) => state.border.enabled,
      default: DEFAULT_BORDER_RADIUS,
      key: 'border.radius',
      labelKey: 'board_radius',
      max: 50,
      min: 0,
      step: 1,
      type: 'slider',
    });
  }

  // Guide Lines toggle always last — after all dimensional controls
  children.push({
    condition: (state: PuzzleState) => state.border.enabled,
    default: false,
    key: 'border.guideLines',
    labelKey: 'guide_lines',
    type: 'toggle',
  });

  return {
    children,
    enabledBy: 'border.enabled',
    expandable: true,
    key: 'border',
    labelKey: 'puzzle_board',
    type: 'group',
  };
};

const createPuzzleTypeConfig = (
  id: ShapeType,
  nameKey: string,
  thumbnail: string,
  borderOptions: BorderGroupOptions = {},
  extraProperties: PropertyDef[] = [],
): PuzzleTypeConfig => ({
  id,
  nameKey,
  properties: [
    createImageGroup(),
    createBorderGroup(borderOptions),
    COLUMNS_PROPERTY,
    ROWS_PROPERTY,
    PIECE_SIZE_PROPERTY,
    TAB_SIZE_PROPERTY,
    ORIENTATION_PROPERTY,
    ...extraProperties,
  ],
  thumbnail,
});

export const PUZZLE_TYPES: PuzzleTypeConfig[] = [
  createPuzzleTypeConfig('rectangle', 'types.rectangle_jigsaw', rectangleThumbnail, { includeCornerRadius: true }, [
    RADIUS_PROPERTY,
  ]),
  createPuzzleTypeConfig('circle', 'types.circle_jigsaw', circleThumbnail),
  createPuzzleTypeConfig('heart', 'types.heart_jigsaw', heartThumbnail),
  // Hexagon uses custom rows default, so define manually
  {
    id: 'hexagon',
    nameKey: 'types.hex_jigsaw',
    properties: [
      createImageGroup(),
      createBorderGroup({ includeCornerRadius: true }),
      COLUMNS_PROPERTY,
      HEXAGON_ROWS_PROPERTY,
      PIECE_SIZE_PROPERTY,
      TAB_SIZE_PROPERTY,
      ORIENTATION_PROPERTY,
      RADIUS_PROPERTY,
    ],
    thumbnail: hexagonThumbnail,
  },
];

export const getPuzzleTypeById = (id: string): PuzzleTypeConfig | undefined =>
  PUZZLE_TYPES.find((type) => type.id === id);

export const getDefaultPuzzleType = (): PuzzleTypeConfig => PUZZLE_TYPES[0];
