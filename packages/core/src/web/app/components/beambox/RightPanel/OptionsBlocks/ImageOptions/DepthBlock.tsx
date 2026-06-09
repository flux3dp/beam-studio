import React, { Fragment, memo, useCallback, useEffect } from 'react';

import { Switch } from 'antd';

import useForceUpdate from '@core/helpers/use-force-update';
import useI18n from '@core/helpers/useI18n';

import OptionsInput from '../OptionsInput';

import styles from './ImageOptions.module.scss';

interface Props {
  changeAttribute: (changes: { [key: string]: boolean | number | string }) => void;
  elem: Element;
}

const DepthBlock = ({ changeAttribute, elem }: Props): React.JSX.Element => {
  const {
    laser_panel: tLaserPanel,
    object_panel: { option_panel: lang },
  } = useI18n().beambox.right_panel;
  const forceUpdate = useForceUpdate();

  const depthPass = +(elem.getAttribute('data-pass') ?? '0');
  const depthZStep = +(elem.getAttribute('data-zstep') ?? '0');

  const handleInputChange = useCallback(
    (val: null | number, key: 'data-pass' | 'data-zstep') => {
      if (val === null) return;

      changeAttribute({ [key]: val });
      forceUpdate();
    },
    [changeAttribute, forceUpdate],
  );

  useEffect(() => {
    if (depthPass > 0 && depthZStep > 10 / depthPass) {
      handleInputChange(10 / depthPass, 'data-zstep');
    }
  }, [handleInputChange, depthPass, depthZStep]);

  return (
    <Fragment key="depth-engraving">
      <div className={styles['option-block']}>
        <div className={styles.label}>{lang.depth_engraving}</div>
        <Switch
          checked={depthPass > 0}
          onChange={() => handleInputChange(depthPass === 0 ? 100 : -depthPass, 'data-pass')}
          size="small"
        />
      </div>
      {depthPass > 0 && (
        <>
          <div className={styles['option-block']}>
            <div className={styles.label}>{lang.layer_count}</div>
            <OptionsInput
              className={styles.input}
              height={20}
              max={1000}
              min={1}
              onChange={(val) => handleInputChange(val, 'data-pass')}
              precision={0}
              value={depthPass}
            />
          </div>
          <div className={styles['option-block']}>
            <div className={styles.label}>{tLaserPanel.z_step}</div>
            <OptionsInput
              className={styles.input}
              height={20}
              max={depthPass > 0 ? 10 / depthPass : 10}
              min={0}
              onChange={(val) => handleInputChange(val, 'data-zstep')}
              precision={3}
              step={0.01}
              unit="mm"
              value={depthZStep}
              width={70}
            />
          </div>
        </>
      )}
    </Fragment>
  );
};

export default memo(DepthBlock);
