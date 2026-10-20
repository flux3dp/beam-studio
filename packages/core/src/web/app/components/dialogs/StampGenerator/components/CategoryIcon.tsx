import React from 'react';

import type { TemplateCategory } from '../types';

const SHAPES: Record<TemplateCategory, React.JSX.Element> = {
  circle: <circle cx="8" cy="8" r="6" />,
  oval: <ellipse cx="8" cy="8" rx="7" ry="4.5" />,
  rect: <rect height="8" rx="1" width="13" x="1.5" y="4" />,
  square: <rect height="11" rx="1.5" width="11" x="2.5" y="2.5" />,
};

/** Outline of the tab's frame shape, drawn in the current text color. */
const CategoryIcon = ({ category }: { category: TemplateCategory }): React.JSX.Element => (
  <svg fill="none" height="1em" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 16 16" width="1em">
    {SHAPES[category]}
  </svg>
);

export default CategoryIcon;
