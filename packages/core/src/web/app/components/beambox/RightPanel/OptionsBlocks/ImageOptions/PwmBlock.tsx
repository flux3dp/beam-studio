import React, { memo, useCallback } from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Switch } from 'antd';

import ObjectPanelItem from '@core/app/components/beambox/RightPanel/ObjectPanelItem';
import { useIsMobile } from '@core/app/stores/screenStore';
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
  const isMobile = useIsMobile();
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

  return isMobile ? (
    <ObjectPanelItem.Item
      content={<Switch checked={isPwm} />}
      id="pwm"
      label={lang.pwm_engraving}
      onClick={() => handlePwmClick(!isPwm)}
    />
  ) : (
    <div className={styles['option-block']} key="pwm">
      <div className={styles.label}>
        {lang.pwm_engraving}
        <QuestionCircleOutlined className={styles.icon} onClick={() => browser.open(lang.pwm_engraving_link)} />
      </div>
      <Switch checked={isPwm} onChange={handlePwmClick} size="small" />
    </div>
  );
};

export default memo(PwmBlock);
