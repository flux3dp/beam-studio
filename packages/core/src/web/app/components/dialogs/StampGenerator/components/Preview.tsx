import React, { memo, useEffect, useRef } from 'react';

import { useStorageStore } from '@core/app/stores/storageStore';
import units from '@core/helpers/units';

import { PX_TO_MM_RATIO } from '../constants';
import useStampStore from '../useStampStore';

import styles from './Preview.module.scss';

const Preview = (): React.JSX.Element => {
  const previewSvg = useStampStore((s) => s.previewSvg);
  const shape = useStampStore((s) => s.shape);
  const sizeRatio = useStampStore((s) => s.sizeRatio);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    container.replaceChildren();

    if (previewSvg) {
      const clone = previewSvg.cloneNode(true) as SVGSVGElement;

      clone.setAttribute('width', '100%');
      clone.setAttribute('height', '100%');
      container.appendChild(clone);
    }
  }, [previewSvg]);

  const isInch = useStorageStore((s) => s.isInch);
  const { height = 0, width = 0 } = shape?.bounds ?? {};
  const format = (px: number) => {
    const mm = (px * sizeRatio) / PX_TO_MM_RATIO;

    return isInch ? `${units.convertUnit(mm, 'inch', 'mm', 2)}in` : `${mm.toFixed(1)}mm`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.dimensions}>
        {format(width)} × {format(height)}
      </div>
      <div className={styles.canvas} ref={containerRef} />
    </div>
  );
};

Preview.displayName = 'Preview';

export default memo(Preview);
