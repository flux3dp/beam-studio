import type { ReactNode } from 'react';
import React, { memo, useMemo } from 'react';

import { DECORATION_PATHS } from '../../constants/decorations';

import type { IconSelectorItem } from './Controls/IconSelectorGrid';
import IconSelectorGrid from './Controls/IconSelectorGrid';

interface DecorationPathSelectorProps {
  onSelect: (key: string) => void;
  options: string[];
  selectedKey: string;
  viewBox: { height: number; width: number; x: number; y: number };
}

const DecorationPathSelector = ({
  onSelect,
  options,
  selectedKey,
  viewBox,
}: DecorationPathSelectorProps): ReactNode => {
  const vb = useMemo(
    () => `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`,
    [viewBox.height, viewBox.width, viewBox.x, viewBox.y],
  );

  const items: IconSelectorItem[] = useMemo(
    () =>
      options.map((key) => ({
        icon: (
          <svg viewBox={vb}>
            <path d={DECORATION_PATHS[key]} fill="black" />
          </svg>
        ),
        key,
      })),
    [options, vb],
  );

  return <IconSelectorGrid items={items} onSelect={onSelect} selectedKey={selectedKey} />;
};

DecorationPathSelector.displayName = 'DecorationPathSelector';

export default memo(DecorationPathSelector);
