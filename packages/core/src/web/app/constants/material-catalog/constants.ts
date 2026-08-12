import type { MaterialCategory } from '@core/interfaces/IMaterial';

/** Fixed category tab order (Favorites / Recents are virtual tabs handled by the UI); `other` always last */
export const MATERIAL_CATEGORIES: MaterialCategory[] = [
  'wood',
  'acrylic',
  'leather',
  'metal',
  'plastic',
  'paper',
  'glass',
  'stone',
  'rubber',
  'other',
];

/** Cover fallback color when a material has neither image nor coverColor */
export const CATEGORY_COLORS: Record<MaterialCategory, string> = {
  acrylic: '#a9d6ff',
  glass: '#c7e6e2',
  leather: '#b5793f',
  metal: '#9aa4af',
  other: '#c9c9c9',
  paper: '#efe7d3',
  plastic: '#d9c9e8',
  rubber: '#4a4a4a',
  stone: '#8a8f94',
  wood: '#c2884f',
};

/** Id of the user-owned "My Materials" bucket (created lazily; category `other`) */
export const MY_MATERIALS_ID = 'user_bucket';

export const RECENTS_LIMIT = 20;
