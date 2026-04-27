import type { ComponentType, ReactNode } from 'react';
import React, { memo, useEffect, useMemo, useState } from 'react';

import Icon, { EllipsisOutlined } from '@ant-design/icons';
import classNames from 'classnames';

import importIcon from '@core/app/components/dialogs/ElementPanel/Element/importIcon';

import { loadShape, svgCache } from '../../../builders/buildElement';
import type { IconSelectorItem } from '../Controls/IconSelectorGrid';
import IconSelectorGrid from '../Controls/IconSelectorGrid';
import iconSelectorStyles from '../Controls/IconSelectorGrid.module.scss';
import SelectedItemSlot from '../Controls/SelectedItemSlot';

import styles from './PresetSelector.module.scss';

/** Cache of imported preset icon React components. */
const presetIconComponents: { [key: string]: ComponentType } = {};

/** Renders a built-in preset shape via the same `importIcon` pattern as BuiltinElement. */
const PresetIcon = memo(({ shapeKey }: { shapeKey: string }): ReactNode => {
  const [, setVersion] = useState(0);

  useEffect(() => {
    if (presetIconComponents[shapeKey]) {
      setVersion((v) => v + 1);

      return;
    }

    let cancelled = false;

    importIcon(shapeKey)
      .then((icon) => {
        if (cancelled) return;

        presetIconComponents[shapeKey] = icon;
        setVersion((v) => v + 1);
      })
      .catch((err) => console.error(`Failed to load preset shape ${shapeKey}:`, err));

    return () => {
      cancelled = true;
    };
  }, [shapeKey]);

  const IconComponent = presetIconComponents[shapeKey];

  if (!IconComponent) return null;

  return <Icon className={styles.icon} component={IconComponent} />;
});

PresetIcon.displayName = 'PresetIcon';

/** Renders any shape icon (built-in or np/) using the shared svgCache from buildElement. */
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
    () => options.map((key) => ({ icon: <PresetIcon shapeKey={key} />, key })),
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
