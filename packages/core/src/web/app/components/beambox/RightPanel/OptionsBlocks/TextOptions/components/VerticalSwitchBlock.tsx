import React, { memo } from 'react';

import { Button, ConfigProvider } from 'antd';
import classNames from 'classnames';

import ControlBlock from '@core/app/components/beambox/RightPanel/common/ControlBlock';
import Switch from '@core/app/components/beambox/RightPanel/common/Switch';
import { iconButtonTheme } from '@core/app/constants/antd-config';
import OptionPanelIcons from '@core/app/icons/option-panel/OptionPanelIcons';
import { useIsTabletOrMobile } from '@core/app/stores/layoutStore';
import { ControlType } from '@core/helpers/element/editable/base';
import useI18n from '@core/helpers/useI18n';
import type { ConfigItem } from '@core/interfaces/ILayerConfig';

import styles from './VerticalSwitchBlock.module.scss';

interface VerticalSwitchBlockProps {
  isVertical: ConfigItem<boolean>;
  onToggle: (checked: boolean) => void;
}

const VerticalSwitchBlock = ({ isVertical, onToggle }: VerticalSwitchBlockProps): React.ReactNode => {
  const langOptionPanel = useI18n().beambox.right_panel.object_panel.option_panel;
  const isTablet = useIsTabletOrMobile();
  const checked = !isVertical.hasMultiValue && isVertical.value;

  return isTablet ? (
    <ControlBlock className={styles.block} label={langOptionPanel.vertical_text} type={ControlType.TEXT_VERTICAL}>
      <Switch checked={checked} onClick={() => onToggle(checked)} />
    </ControlBlock>
  ) : (
    <ControlBlock className={styles.block} type={ControlType.TEXT_VERTICAL}>
      <ConfigProvider theme={iconButtonTheme}>
        <Button
          className={classNames({ [styles.active]: checked })}
          icon={<OptionPanelIcons.VerticalText />}
          id="vertical-text"
          onClick={() => onToggle(checked)}
          title={langOptionPanel.vertical_text}
          type="text"
        />
      </ConfigProvider>
    </ControlBlock>
  );
};

export default memo(VerticalSwitchBlock);
