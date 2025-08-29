import React from 'react';

import { Button, ConfigProvider, Switch } from 'antd';
import classNames from 'classnames';
import { useShallow } from 'zustand/react/shallow';

import { iconButtonTheme } from '@core/app/constants/antd-config';
import OptionPanelIcons from '@core/app/icons/option-panel/OptionPanelIcons';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import styles from '../../index.module.scss';
import { useTextOptionsStore } from '../../stores/useTextOptionsStore';

const VerticalTextToggle: React.FC = () => {
  const { configs, handleVerticalTextChange } = useTextOptionsStore(
    useShallow((state) => ({
      configs: state.configs,
      handleVerticalTextChange: state.handleVerticalTextChange,
    })),
  );
  const { isVertical } = configs;
  const lang = useI18n().beambox.right_panel.object_panel.option_panel;
  const isMobile = useIsMobile();

  const checked = !isVertical.hasMultiValue && isVertical.value;
  const handleClick = () => handleVerticalTextChange?.(!checked);

  return isMobile ? (
    <ObjectPanelItem.Item
      content={<Switch checked={checked} />}
      id="vertical-text"
      label={lang.vertical_text}
      onClick={handleClick}
    />
  ) : (
    <ConfigProvider theme={iconButtonTheme}>
      <Button
        className={classNames(styles['vertical-text'], { [styles.active]: checked })}
        icon={<OptionPanelIcons.VerticalText />}
        id="vertical-text"
        onClick={handleClick}
        title={lang.vertical_text}
        type="text"
      />
    </ConfigProvider>
  );
};

export default VerticalTextToggle;
