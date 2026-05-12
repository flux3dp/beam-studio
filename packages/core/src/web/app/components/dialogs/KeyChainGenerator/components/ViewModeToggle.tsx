import React, { memo, useEffect, useRef } from 'react';

import { Tooltip } from 'antd';
import classNames from 'classnames';

import useI18n from '@core/helpers/useI18n';

import type { KeychainViewMode } from '../constants';
import useKeychainShapeStore from '../useKeychainShapeStore';

import styles from './ViewModeToggle.module.scss';

interface ViewModeToggleProps {
  designSvg: null | SVGSVGElement;
  explodedSvg: null | SVGSVGElement;
}

interface ThumbProps {
  svg: null | SVGSVGElement;
}

const Thumb = ({ svg }: ThumbProps): React.JSX.Element => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    while (container.firstChild) container.removeChild(container.firstChild);

    if (svg) {
      const clone = svg.cloneNode(true) as SVGSVGElement;

      clone.setAttribute('width', '100%');
      clone.setAttribute('height', '100%');
      clone.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      container.appendChild(clone);
    }
  }, [svg]);

  return <div className={styles.thumb} ref={containerRef} />;
};

const ViewModeToggle = ({ designSvg, explodedSvg }: ViewModeToggleProps): React.JSX.Element => {
  const { keychain_generator: t } = useI18n();
  const viewMode = useKeychainShapeStore((s) => s.viewMode);
  const setViewMode = useKeychainShapeStore((s) => s.setViewMode);

  const buttons: Array<{ label: string; mode: KeychainViewMode; svg: null | SVGSVGElement }> = [
    { label: t.design_preview, mode: 'design', svg: designSvg },
    { label: t.exploded_view, mode: 'exploded', svg: explodedSvg },
  ];

  return (
    <div className={styles.container}>
      {buttons.map(({ label, mode, svg }) => (
        <Tooltip key={mode} title={label}>
          <button
            aria-label={label}
            aria-pressed={viewMode === mode}
            className={classNames(styles.button, { [styles.active]: viewMode === mode })}
            onClick={() => setViewMode(mode)}
            type="button"
          >
            <Thumb svg={svg} />
          </button>
        </Tooltip>
      ))}
    </div>
  );
};

ViewModeToggle.displayName = 'ViewModeToggle';

export default memo(ViewModeToggle);
