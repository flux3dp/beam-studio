import React, { memo, useEffect, useState } from 'react';

import { Slider, Tooltip } from 'antd';

import WorkareaIcons from '@core/app/icons/workarea/WorkareaIcons';
import useI18n from '@core/helpers/useI18n';

import styles from './OpacitySlider.module.scss';

interface Props {
  setValue: (val: number) => void;
  value: number;
}

const OpacitySlider = ({ setValue, value }: Props): React.JSX.Element => {
  const [opacity, setOpacity] = useState(value);
  const lang = useI18n();

  useEffect(() => {
    setValue(opacity);
  }, [opacity, setValue]);

  return (
    <div className={styles.container}>
      <Tooltip title={lang.editor.opacity}>
        <WorkareaIcons.Opacity className={styles.icon} />
      </Tooltip>
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
    </div>
  );
};

export default memo(OpacitySlider);
