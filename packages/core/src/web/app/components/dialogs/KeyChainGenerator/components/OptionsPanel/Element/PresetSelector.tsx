import type { ComponentType, ReactNode } from 'react';
import React, { memo, useEffect, useMemo, useState } from 'react';

import Icon, { EllipsisOutlined } from '@ant-design/icons';
import classNames from 'classnames';

import importIcon from '@core/app/components/dialogs/ElementPanel/Element/importIcon';

import type { IconSelectorItem } from '../Controls/IconSelectorGrid';
import IconSelectorGrid from '../Controls/IconSelectorGrid';
import iconSelectorStyles from '../Controls/IconSelectorGrid.module.scss';

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

interface PresetSelectorProps {
  onMore?: () => void;
  onSelect: (shapeKey: string) => void;
  options: string[];
  selectedKey: string;
}

const PresetSelector = ({ onMore, onSelect, options, selectedKey }: PresetSelectorProps): ReactNode => {
  const items: IconSelectorItem[] = useMemo(
    () => options.map((key) => ({ icon: <PresetIcon shapeKey={key} />, key })),
    [options],
  );

  const moreButton = onMore ? (
    <button className={classNames(iconSelectorStyles.item, styles.more)} onClick={onMore} type="button">
      <EllipsisOutlined />
    </button>
  ) : undefined;

  return <IconSelectorGrid items={items} onSelect={onSelect} selectedKey={selectedKey} suffix={moreButton} />;
};

PresetSelector.displayName = 'PresetSelector';

export default memo(PresetSelector);
