import React, { useEffect, useMemo, useRef } from 'react';

import classNames from 'classnames';
import { pick } from 'remeda';
import { useShallow } from 'zustand/shallow';

import { useIsMobile } from '@core/helpers/system-helper';

import { PX_TO_MM_RATIO } from '../constants';
import useContainerSize from '../hooks/useContainerSize';
import type { KeyChainCategory } from '../types';
import useKeychainShapeStore from '../useKeychainShapeStore';

import styles from './Preview.module.scss';

interface PreviewProps {
  category: KeyChainCategory;
}

const Preview = ({ category }: PreviewProps): React.JSX.Element => {
  const isMobile = useIsMobile();
  const { containerRef, size } = useContainerSize();
  const { buildShape, shape, state } = useKeychainShapeStore(useShallow(pick(['state', 'buildShape', 'shape'])));
  const { bounds: { height = 0, width = 0 } = {} } = shape ?? {};

  useEffect(() => {
    buildShape(category);
  }, [state, category, buildShape]);

  const svgElement = shape?.svgElement ?? null;
  const svgContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = svgContainerRef.current;

    if (!container) return;

    while (container.firstChild) container.removeChild(container.firstChild);

    if (svgElement) container.appendChild(svgElement);
  }, [svgElement]);

  const dimensionsMm = useMemo(
    () => ({
      height: height / PX_TO_MM_RATIO,
      width: width / PX_TO_MM_RATIO,
    }),
    [height, width],
  );

  // Compute scaled SVG size to fit within the container with padding
  const padding = 32;
  const scaledSize = useMemo(() => {
    const availW = size.width - padding * 2;
    const availH = size.height - padding * 2 - 24; // 24px for dimension label
    const scale = Math.min(availW / (width || 1), availH / (height || 1), 1);

    return { height: height * scale, width: width * scale };
  }, [height, width, size]);

  return (
    <div className={classNames(styles['preview-area'], { [styles.mobile]: isMobile })} ref={containerRef}>
      <div className={styles['preview-canvas']}>
        <div className={styles['preview-content']}>
          <div ref={svgContainerRef} style={{ height: scaledSize.height, width: scaledSize.width }} />
          <div className={styles.dimensions}>
            {dimensionsMm.width.toFixed(0)} x {dimensionsMm.height.toFixed(0)} mm
          </div>
        </div>
      </div>
    </div>
  );
};

Preview.displayName = 'Preview';

export default Preview;
