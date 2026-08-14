import React, { memo } from 'react';

import { Collapse, ConfigProvider } from 'antd';

import { laserModules, LayerModule, printingModules } from '@core/app/constants/layer-module/layer-modules';
import { useConfigPanelStore } from '@core/app/stores/configPanel';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import isDev from '@core/helpers/is-dev';

import styles from './AdvancedBlock.module.scss';
import Backlash from './Backlash';
import ColorAdvancedSettingButton from './ColorAdvancedSetting/ColorAdvancedSettingButton';
import LaserDevOptions from './LaserDevOptions';
import MinPadding from './MinPadding';
import NozzleBlock from './NozzleBlock';
import PrintingPaddingBlock from './PrintingPaddingBlock';
import RefreshThresholdBlock from './RefreshThresholdBlock';
import SCurveBlock from './SCurveBlock';
import WhiteInkCheckbox from './WhiteInkCheckbox';

// Dev-only settings, so the label is not translated
const DevBlock = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.ReactNode => {
  const { fullcolor, module } = useConfigPanelStore();
  const workarea = useWorkarea();
  const isCustomBacklashEnabled = useGlobalPreferenceStore((state) => state['enable-custom-backlash']);

  if (!isDev()) return null;

  const isLaser = laserModules.has(module.value);
  const isPrinting = printingModules.has(module.value);
  const contents = [];

  if (isPrinting && fullcolor.value) contents.push(<WhiteInkCheckbox key="white-ink-checkbox" type={type} />);

  if (isCustomBacklashEnabled) contents.push(<Backlash key="backlash" type={type} />);

  if (isLaser) contents.push(<LaserDevOptions key="laser-dev-options" />);

  contents.push(<MinPadding key="min-padding" type={type} />);

  if (isPrinting) contents.push(<PrintingPaddingBlock key="printing-padding-block" type={type} />);

  if (isLaser && (workarea === 'fhx2rf' || workarea === 'fbb2')) {
    contents.push(<SCurveBlock key="s-curve-block" type={type} />);
  }

  if (module.value === LayerModule.PRINTER_4C) {
    contents.push(
      <ColorAdvancedSettingButton key="color-advanced-setting-button" />,
      <RefreshThresholdBlock key="refresh-threshold-block" type={type} />,
      <NozzleBlock key="nozzle-block" type={type} />,
    );
  }

  return (
    <ConfigProvider
      theme={{
        components: {
          Collapse: {
            contentPadding: 0,
            headerPadding: '0 20px',
          },
        },
      }}
    >
      <Collapse
        className={styles.container}
        defaultActiveKey={[]}
        ghost
        items={[
          {
            children: <div className={styles.panel}>{contents}</div>,
            key: '1',
            label: 'Developer Settings',
          },
        ]}
      />
    </ConfigProvider>
  );
};

export default memo(DevBlock);
