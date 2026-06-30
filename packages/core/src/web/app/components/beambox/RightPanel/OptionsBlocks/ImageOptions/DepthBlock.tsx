import React, { Fragment, memo, useCallback, useEffect } from 'react';

import Label from '@core/app/components/beambox/RightPanel/common/Label';
import Switch from '@core/app/components/beambox/RightPanel/common/Switch';
import { useIsTabletOrMobile } from '@core/app/stores/screenStore';
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
  const isTablet = useIsTabletOrMobile();
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

  const [toggle, stepInput, zStepInput] = [
    <Switch
      checked={depthPass > 0}
      key="depth-toggle"
      onChange={() => handleInputChange(depthPass === 0 ? 100 : -depthPass, 'data-pass')}
    />,
    <OptionsInput
      className={styles.input}
      height={20}
      key="depth-pass"
      max={1000}
      min={1}
      onChange={(val) => handleInputChange(val, 'data-pass')}
      precision={0}
      value={depthPass}
    />,
    <OptionsInput
      className={styles.input}
      height={20}
      key="depth-zstep"
      max={depthPass > 0 ? 10 / depthPass : 10}
      min={0}
      onChange={(val) => handleInputChange(val, 'data-zstep')}
      precision={3}
      step={0.01}
      unit="mm"
      value={depthZStep}
      width={70}
    />,
  ];

  return isTablet ? (
    <>
      <Label extra={toggle}>{lang.depth_engraving}</Label>
      {depthPass > 0 && (
        <>
          <Label extra={stepInput}>{lang.layer_count}</Label>
          <Label extra={zStepInput}>{tLaserPanel.z_step}</Label>
        </>
      )}
    </>
  ) : (
    <Fragment key="depth-engraving">
      <div className={styles['option-block']}>
        <div className={styles.label}>{lang.depth_engraving}</div>
        {toggle}
      </div>
      {depthPass > 0 && (
        <>
          <div className={styles['option-block']}>
            <div className={styles.label}>{lang.layer_count}</div>
            {stepInput}
          </div>
          <div className={styles['option-block']}>
            <div className={styles.label}>{tLaserPanel.z_step}</div>
            {zStepInput}
          </div>
        </>
      )}
    </Fragment>
  );
};

export default memo(DepthBlock);
