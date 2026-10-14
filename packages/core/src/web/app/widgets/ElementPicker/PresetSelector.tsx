import type { ReactNode } from 'react';
import React, { memo, useEffect, useMemo, useState } from 'react';

import { EllipsisOutlined } from '@ant-design/icons';
import classNames from 'classnames';

import type { IconSelectorItem } from '@core/app/widgets/IconSelectorGrid';
import IconSelectorGrid from '@core/app/widgets/IconSelectorGrid';
import iconSelectorStyles from '@core/app/widgets/IconSelectorGrid.module.scss';
import { loadShape, svgCache } from '@core/helpers/generator/loadShape';

import styles from './PresetSelector.module.scss';
import SelectedItemSlot from './SelectedItemSlot';

/** Renders any shape icon (bundled, built-in or np/) from the shared svgCache, loading it on first use. */
const ShapeIcon = memo(({ shapeKey }: { shapeKey: string }): ReactNode => {
  const [svgMarkup, setSvgMarkup] = useState(() => svgCache.get(shapeKey) ?? '');

  useEffect(() => {
    if (!shapeKey) return;

    const cached = svgCache.get(shapeKey);

    if (cached) {
      setSvgMarkup(cached);

      return;
    }

    let cancelled = false;

    loadShape(shapeKey).then((result) => {
      if (cancelled || !result) return;

      setSvgMarkup(result);
    });

    return () => {
      cancelled = true;
    };
  }, [shapeKey]);

  if (!svgMarkup) return null;

  return <span className={styles.icon} dangerouslySetInnerHTML={{ __html: svgMarkup }} />;
});

ShapeIcon.displayName = 'ShapeIcon';

interface PresetSelectorProps {
  onClear?: () => void;
  onMore?: () => void;
  onSelect: (shapeKey: string) => void;
  options: string[];
  selectedKey: string;
}

const PresetSelector = ({ onClear, onMore, onSelect, options, selectedKey }: PresetSelectorProps): ReactNode => {
  const items: IconSelectorItem[] = useMemo(
    () => options.map((key) => ({ icon: <ShapeIcon shapeKey={key} />, key })),
    [options],
  );

  const moreButton = onMore ? (
    <button className={classNames(iconSelectorStyles.item, styles.more)} onClick={onMore} type="button">
      <EllipsisOutlined />
    </button>
  ) : undefined;

  const prefix = (
    <SelectedItemSlot onClear={selectedKey ? onClear : undefined}>
      {selectedKey && <ShapeIcon shapeKey={selectedKey} />}
    </SelectedItemSlot>
  );

  return (
    <IconSelectorGrid items={items} onSelect={onSelect} prefix={prefix} selectedKey={selectedKey} suffix={moreButton} />
  );
};

PresetSelector.displayName = 'PresetSelector';

export default memo(PresetSelector);
