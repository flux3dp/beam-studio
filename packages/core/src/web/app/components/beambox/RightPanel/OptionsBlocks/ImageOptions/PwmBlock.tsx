import React, { memo, useCallback } from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';

import Label from '@core/app/components/beambox/RightPanel/common/Label';
import Switch from '@core/app/components/beambox/RightPanel/common/Switch';
import { useIsTabletOrMobile } from '@core/app/stores/layoutStore';
import useForceUpdate from '@core/helpers/use-force-update';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';

import styles from './ImageOptions.module.scss';

interface Props {
  changeAttribute: (changes: { [key: string]: boolean | number | string }) => void;
  elem: Element;
}

const PwmBlock = ({ changeAttribute, elem }: Props): React.JSX.Element => {
  const lang = useI18n().beambox.right_panel.object_panel.option_panel;
  const isTablet = useIsTabletOrMobile();
  const forceUpdate = useForceUpdate();

  const isPwm = elem.getAttribute('data-pwm') === '1';

  const handlePwmClick = useCallback(
    (newVal: boolean) => {
      changeAttribute({
        'data-pwm': newVal ? '1' : '0',
      });
      forceUpdate();
    },
    [changeAttribute, forceUpdate],
  );

  const label = (
    <>
      {lang.pwm_engraving}
      <QuestionCircleOutlined className={styles.icon} onClick={() => browser.open(lang.pwm_engraving_link)} />
    </>
  );

  return isTablet ? (
    <Label extra={<Switch checked={isPwm} onChange={handlePwmClick} />}>{label}</Label>
  ) : (
    <div className={styles['option-block']} key="pwm">
      <div className={styles.label}>{label}</div>
      <Switch checked={isPwm} onChange={handlePwmClick} />
    </div>
  );
};

export default memo(PwmBlock);
