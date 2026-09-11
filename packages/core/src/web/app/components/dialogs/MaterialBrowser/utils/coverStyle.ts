import type React from 'react';

import { CATEGORY_COLORS } from '@core/app/constants/material-catalog/constants';
import type { Material } from '@core/interfaces/IMaterial';

/** Card/hero cover: photo → coverColor → category fallback color */
export const getCoverStyle = (material: Material): React.CSSProperties => {
  if (material.image) return { backgroundImage: `url(${material.image})` };

  return { background: material.coverColor ?? CATEGORY_COLORS[material.category] };
};
