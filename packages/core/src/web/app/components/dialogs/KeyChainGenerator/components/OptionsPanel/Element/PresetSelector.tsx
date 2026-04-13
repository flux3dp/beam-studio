import type { ComponentType, ReactNode } from 'react';
import React, { memo, useEffect, useState } from 'react';

import Icon, { CloseOutlined } from '@ant-design/icons';
import classNames from 'classnames';

import importIcon from '@core/app/components/dialogs/ElementPanel/Element/importIcon';

import { loadShape, NP_SHAPE_PREFIX, svgCache } from '../../../builders';

import styles from './PresetSelector.module.scss';

/** Curated preset shape keys (7 items) shown after the current shape slot. */
const PRESET_SHAPES: string[] = [
  'basic/icon-heart1',
  'basic/icon-star1',
  'basic/icon-sparkle',
  'basic/icon-diamond',
  'basic/icon-drop',
  'basic/icon-sun',
  'basic/icon-cloud',
];

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

  if (!IconComponent) return <div className={styles.iconPlaceholder} />;

  return <Icon className={styles.icon} component={IconComponent} />;
});

PresetIcon.displayName = 'PresetIcon';

/**
 * Renders the currently selected shape. Supports both built-in shapes and
 * Noun Project icons (`np/<id>`) via the SVG-string cache.
 */
const CurrentShapeIcon = memo(({ shapeKey }: { shapeKey: string }): ReactNode => {
  const [svg, setSvg] = useState<null | string>(svgCache.get(shapeKey) ?? null);

  useEffect(() => {
    if (!shapeKey.startsWith(NP_SHAPE_PREFIX)) return;

    if (svgCache.has(shapeKey)) {
      setSvg(svgCache.get(shapeKey) ?? null);

      return;
    }

    let cancelled = false;

    loadShape(shapeKey)
      .then((markup) => {
        if (cancelled || !markup) return;

        setSvg(markup);
      })
      .catch((err) => console.error(`Failed to load shape ${shapeKey}:`, err));

    return () => {
      cancelled = true;
    };
  }, [shapeKey]);

  if (shapeKey.startsWith(NP_SHAPE_PREFIX)) return <PresetIcon shapeKey={shapeKey} />;

  if (!svg) return <div className={styles.iconPlaceholder} />;

  return <div className={styles.icon} dangerouslySetInnerHTML={{ __html: svg }} />;
});

CurrentShapeIcon.displayName = 'CurrentShapeIcon';

interface PresetSelectorProps {
  onSelect: (shapeKey: string) => void;
  selectedKey: string;
}

const PresetSelector = ({ onSelect, selectedKey }: PresetSelectorProps): ReactNode => {
  return (
    <div className={styles.grid}>
      <div className={classNames(styles.item, styles.current, { [styles.empty]: !selectedKey })}>
        {selectedKey && (
          <>
            <CurrentShapeIcon shapeKey={selectedKey} />
            <button
              aria-label="Clear current shape"
              className={styles.clear}
              onClick={() => onSelect('')}
              type="button"
            >
              <CloseOutlined />
            </button>
          </>
        )}
      </div>
      {PRESET_SHAPES.map((key) => (
        <button
          className={classNames(styles.item, { [styles.selected]: key === selectedKey })}
          key={key}
          onClick={() => onSelect(key)}
          type="button"
        >
          <PresetIcon shapeKey={key} />
        </button>
      ))}
    </div>
  );
};

PresetSelector.displayName = 'PresetSelector';

export default memo(PresetSelector);
