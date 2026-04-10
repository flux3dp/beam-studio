import React, { useEffect, useMemo, useRef } from 'react';

import classNames from 'classnames';

import { useIsMobile } from '@core/helpers/system-helper';

import { PX_TO_MM_RATIO } from '../constants';
import useContainerSize from '../hooks/useContainerSize';
import type { KeyChainCategory } from '../types';
import useKeychainShapeStore from '../useKeychainShapeStore';

import styles from './Preview.module.scss';
import ViewModeToggle from './ViewModeToggle';

interface PreviewProps {
  category: KeyChainCategory;
}

const Preview = ({ category }: PreviewProps): React.JSX.Element => {
  const isMobile = useIsMobile();
  const { containerRef, size } = useContainerSize();
  const shape = useKeychainShapeStore((s) => s.shape);
  const viewMode = useKeychainShapeStore((s) => s.viewMode);
  const { bounds: { height = 0, width = 0 } = {} } = shape ?? {};

  useEffect(() => {
    const { applyOptions, buildBaseShape } = useKeychainShapeStore.getState();

    buildBaseShape(category).then((isFresh) => {
      if (isFresh) applyOptions();
    });
  }, [category]);

  const svgElement = useMemo(() => {
    if (!shape) return null;

    return viewMode === 'design' ? shape.designSvg : shape.explodedSvg;
  }, [shape, viewMode]);

  const svgContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = svgContainerRef.current;

    if (!container) return;

    while (container.firstChild) container.removeChild(container.firstChild);

    if (svgElement) {
      const clone = svgElement.cloneNode(true) as SVGSVGElement;

      clone.setAttribute('width', '100%');
      clone.setAttribute('height', '100%');
      container.appendChild(clone);
    }
  }, [svgElement]);

  const dimensionsMm = useMemo(
    () => ({
      height: height / PX_TO_MM_RATIO,
      width: width / PX_TO_MM_RATIO,
    }),
    [height, width],
  );

  // Compute scaled SVG container size from the active SVG's viewBox so the renderer
  // can fill the available space without distorting (preserveAspectRatio handles the
  // actual fitting inside the container).
  const padding = 32;
  const scaledSize = useMemo(() => {
    if (!svgElement) return { height: 0, width: 0 };

    const viewBox = svgElement.viewBox.baseVal;
    const vbWidth = viewBox.width || width || 1;
    const vbHeight = viewBox.height || height || 1;
    const availW = size.width - padding * 2;
    const availH = size.height - padding * 2 - 24 - 96; // 24 dimensions label + 96 toggle row
    const scale = Math.min(availW / vbWidth, availH / vbHeight, 1);

    return { height: vbHeight * scale, width: vbWidth * scale };
  }, [svgElement, size, width, height]);

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
      <ViewModeToggle designSvg={shape?.designSvg ?? null} explodedSvg={shape?.explodedSvg ?? null} />
    </div>
  );
};

Preview.displayName = 'Preview';

export default Preview;
