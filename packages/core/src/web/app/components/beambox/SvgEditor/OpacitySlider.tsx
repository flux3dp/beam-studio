import type { ReactNode } from 'react';
import React, { useCallback, useEffect } from 'react';

import { Slider } from 'antd';

import { setCameraPreviewState, useCameraPreviewStore } from '@core/app/stores/cameraPreview';

import styles from './OpacitySlider.module.scss';

const OpacitySlider = (): ReactNode => {
  const opacity = useCameraPreviewStore((state) => state.bgOpacity);

  const updateBgOpacity = useCallback((val: number) => {
    const container: null | SVGGElement = document.querySelector('#previewSvg');

    if (container) container.style.opacity = String(val);
  }, []);

  useEffect(() => {
    updateBgOpacity(opacity);
  }, [opacity, updateBgOpacity]);

  const handleChange = (val: number) => {
    setCameraPreviewState({ bgOpacity: val });
    updateBgOpacity(val);
  };

  return (
    <>
      <Slider
        className={styles.slider}
        max={1}
        min={0}
        onChange={handleChange}
        step={0.25}
        tooltip={{ open: false }}
        value={opacity}
      />
      <div className={styles.value}>{opacity * 100}%</div>
    </>
  );
};

export default OpacitySlider;
