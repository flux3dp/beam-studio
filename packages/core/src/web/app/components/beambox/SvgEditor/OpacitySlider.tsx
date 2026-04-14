import type { ReactNode } from 'react';
import React, { useCallback, useEffect, useState } from 'react';

import { Slider } from 'antd';

import styles from './OpacitySlider.module.scss';

const OpacitySlider = (): ReactNode => {
  const [opacity, setOpacity] = useState(1);

  const updateBgOpacity = useCallback((val: number) => {
    const container: null | SVGGElement = document.querySelector('#previewSvg');

    if (container) container.style.opacity = String(val);
  }, []);

  useEffect(() => {
    updateBgOpacity(opacity);
  }, [opacity, updateBgOpacity]);

  return (
    <>
      <Slider
        className={styles.slider}
        max={1}
        min={0}
        onChange={setOpacity}
        step={0.25}
        tooltip={{ open: false }}
        value={opacity}
      />
      <div className={styles.value}>{opacity * 100}%</div>
    </>
  );
};

export default OpacitySlider;
