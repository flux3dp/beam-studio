import { match } from 'ts-pattern';

import type { CirclePuzzleState, HeartPuzzleState, HexagonPuzzleState, RectanglePuzzleState, ShapeType } from './types';
import type {
  GroupPropertyDef,
  NumberPropertyDef,
  PropertyDef,
  PuzzleState,
  PuzzleTypeConfig,
  SelectPropertyDef,
} from './types';

const DEFAULT_COLUMNS = 5;
const DEFAULT_ROWS = 5;
const DEFAULT_PIECE_SIZE = 15;
const DEFAULT_TAB_SIZE = 20;
const DEFAULT_BORDER_WIDTH = 5;
const DEFAULT_BORDER_RADIUS = 0;
const DEFAULT_ORIENTATION = 1;
const DEFAULT_RADIUS = 0;

// Import them here and assign below. TypeSelector falls back to text labels when empty.
const circleThumbnail = 'core-img/puzzle-generator/circle.jpg';
const rectangleThumbnail = 'core-img/puzzle-generator/rectangle.jpg';
const heartThumbnail = 'core-img/puzzle-generator/heart.jpg';
const hexagonThumbnail = 'core-img/puzzle-generator/hexagon.jpg';

const generateColumnProperty = (override: Partial<NumberPropertyDef> = {}): NumberPropertyDef => ({
  default: DEFAULT_COLUMNS,
  key: 'columns',
  labelKey: 'columns',
  max: 20,
  min: 2,
  step: 1,
  type: 'slider',
  ...override,
});

const generateRowProperty = (override: Partial<NumberPropertyDef> = {}): NumberPropertyDef => ({
  default: DEFAULT_ROWS,
  key: 'rows',
  labelKey: 'rows',
  max: 20,
  min: 2,
  step: 1,
  type: 'slider',
  ...override,
});

const generatePieceSizeProperty = (override: Partial<NumberPropertyDef> = {}): NumberPropertyDef => ({
  default: DEFAULT_PIECE_SIZE,
  key: 'pieceSize',
  labelKey: 'piece_size',
  max: 100,
  min: 10,
  step: 1,
  type: 'slider',
  unit: 'mm',
  ...override,
});

const generateTabSizeProperty = (override: Partial<NumberPropertyDef> = {}): NumberPropertyDef => ({
  default: DEFAULT_TAB_SIZE,
  key: 'tabSize',
  labelKey: 'tab_size',
  max: 30,
  min: 0,
  step: 1,
  type: 'slider',
  ...override,
});

const generateRadiusProperty = (override: Partial<NumberPropertyDef> = {}): NumberPropertyDef => ({
  default: DEFAULT_RADIUS,
  key: 'radius',
  labelKey: 'radius',
  max: 50,
  min: 0,
  step: 1,
  type: 'slider',
  ...override,
});

const generateOrientationProperty = (override: Partial<SelectPropertyDef> = {}): SelectPropertyDef => ({
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
  ...override,
});

const imageEnabled = (state: PuzzleState): boolean => state.image.enabled;
const imageUploaded = (state: PuzzleState): boolean => state.image.enabled && state.image.dataUrl !== null;

const createImageGroup = (): { defaultState: PuzzleState['image']; property: GroupPropertyDef } => {
  const defaultState: PuzzleState['image'] = {
    bleed: 2,
    dataUrl: null,
    enabled: false,
    exportAs: 'print' as const,
    offsetX: 0,
    offsetY: 0,
    zoom: 100,
  };

  const property: GroupPropertyDef = {
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
  };

  return { defaultState, property };
};

interface BorderGroupOptions {
  includeCornerRadius?: boolean;
}

const createBorderGroup = (
  options: BorderGroupOptions = {},
): { defaultState: PuzzleState['border']; property: GroupPropertyDef } => {
  const { includeCornerRadius = false } = options;
  const defaultWidth = DEFAULT_BORDER_WIDTH;
  const defaultRadius = DEFAULT_BORDER_RADIUS;

  const defaultState: PuzzleState['border'] = {
    enabled: false,
    guideLines: false,
    radius: defaultRadius,
    width: defaultWidth,
  };

  const children: GroupPropertyDef['children'] = [
    {
      default: false,
      key: 'border.enabled',
      labelKey: 'puzzle_board',
      type: 'toggle',
    },
    {
      condition: (state: PuzzleState) => state.border.enabled,
      default: defaultWidth,
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
      default: defaultRadius,
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

  const property: GroupPropertyDef = {
    children,
    enabledBy: 'border.enabled',
    expandable: true,
    key: 'border',
    labelKey: 'puzzle_board',
    type: 'group',
  };

  return { defaultState, property };
};

const generatePropertiesAndDefaultState = (
  shape: ShapeType,
  propertyOverrides: {
    columns?: Partial<NumberPropertyDef>;
    orientation?: Partial<SelectPropertyDef>;
    pieceSize?: Partial<NumberPropertyDef>;
    radius?: Partial<NumberPropertyDef>;
    rows?: Partial<NumberPropertyDef>;
    tabSize?: Partial<NumberPropertyDef>;
  } = {},
): { defaultState: PuzzleState; properties: PropertyDef[] } => {
  const hasCornerRadius = ['hexagon', 'rectangle'].includes(shape);
  const { defaultState: imageDefaultState, property: imageProperty } = createImageGroup();
  const { defaultState: borderDefaultState, property: borderGroup } = createBorderGroup({
    includeCornerRadius: hasCornerRadius,
  });
  const columnProperty = generateColumnProperty(propertyOverrides?.columns);
  const rowProperty = generateRowProperty(propertyOverrides?.rows);
  const pieceSizeProperty = generatePieceSizeProperty(propertyOverrides?.pieceSize);
  const tabSizeProperty = generateTabSizeProperty(propertyOverrides?.tabSize);
  const orientationProperty = generateOrientationProperty(propertyOverrides?.orientation);

  const defaultState: PuzzleState = {
    border: borderDefaultState,
    columns: columnProperty.default,
    image: imageDefaultState,
    orientation: orientationProperty.default as 1 | 2 | 3 | 4,
    pieceSize: pieceSizeProperty.default,
    rows: rowProperty.default,
    tabSize: tabSizeProperty.default,
    typeId: shape,
    viewMode: 'design' as const,
  } as CirclePuzzleState | HeartPuzzleState;

  const properties: PropertyDef[] = [
    imageProperty,
    borderGroup,
    columnProperty,
    rowProperty,
    generatePieceSizeProperty(propertyOverrides?.pieceSize),
    generateTabSizeProperty(propertyOverrides?.tabSize),
    generateOrientationProperty(propertyOverrides?.orientation),
  ];

  if (hasCornerRadius) {
    const radiusProperty = generateRadiusProperty(propertyOverrides?.radius);

    properties.push(radiusProperty);
    (defaultState as unknown as HexagonPuzzleState | RectanglePuzzleState).radius = radiusProperty.default;
  }

  return { defaultState, properties };
};

const { defaultState: rectDefaultState, properties: rectProperties } = generatePropertiesAndDefaultState('rectangle');
const { defaultState: circleDefaultState, properties: circleProperties } = generatePropertiesAndDefaultState('circle', {
  columns: { default: 6 },
  rows: { default: 6 },
});
const { defaultState: heartDefaultState, properties: heartProperties } = generatePropertiesAndDefaultState('heart', {
  columns: { default: 6 },
  rows: { default: 6 },
});
const { defaultState: hexagonDefaultState, properties: hexagonProperties } = generatePropertiesAndDefaultState(
  'hexagon',
  {
    rows: { default: 4 },
  },
);

export const PUZZLE_TYPES: PuzzleTypeConfig[] = [
  {
    id: 'rectangle',
    nameKey: 'types.rectangle_jigsaw',
    properties: rectProperties,
    thumbnail: rectangleThumbnail,
  },
  {
    id: 'circle',
    nameKey: 'types.circle_jigsaw',
    properties: circleProperties,
    thumbnail: circleThumbnail,
  },
  {
    id: 'heart',
    nameKey: 'types.heart_jigsaw',
    properties: heartProperties,
    thumbnail: heartThumbnail,
  },
  {
    id: 'hexagon',
    nameKey: 'types.hex_jigsaw',
    properties: hexagonProperties,
    thumbnail: hexagonThumbnail,
  },
];

export const getPuzzleTypeById = (id: string): PuzzleTypeConfig | undefined =>
  PUZZLE_TYPES.find((type) => type.id === id);

export const getDefaultPuzzleStateById = (id: ShapeType): PuzzleState => {
  return match(id)
    .with('rectangle', () => rectDefaultState)
    .with('circle', () => circleDefaultState)
    .with('heart', () => heartDefaultState)
    .with('hexagon', () => hexagonDefaultState)
    .exhaustive();
};

export const getDefaultPuzzleType = (): PuzzleTypeConfig => PUZZLE_TYPES[0];
