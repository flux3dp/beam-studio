import React, { memo, useEffect, useState } from 'react';
import { Slider, Tooltip } from 'antd';

import WorkareaIcons from 'app/icons/workarea/WorkareaIcons';
import useI18n from 'helpers/useI18n';

import styles from './OpacitySlider.module.scss';
import { AutoFitCanvasManager } from './CanvasManager';

interface Props {
  canvasManager: AutoFitCanvasManager;
}

const OpacitySlider = ({ canvasManager }: Props): JSX.Element => {
  const [opacity, setOpacity] = useState(canvasManager.imageOpacity);
  const lang = useI18n();

  useEffect(() => {
    // eslint-disable-next-line no-param-reassign
    canvasManager.imageOpacity = opacity;
  }, [canvasManager, opacity]);

  return (
    <div className={styles.container}>
      <Tooltip title={lang.editor.opacity}>
        <WorkareaIcons.Opacity className={styles.icon} />
      </Tooltip>
      <Slider
        className={styles.slider}
        min={0}
        max={1}
        step={0.25}
        value={opacity}
        onChange={setOpacity}
        tooltip={{ open: false }}
      />
      <div className={styles.value}>{opacity * 100}%</div>
    </div>
  );
};

export default memo(OpacitySlider);
