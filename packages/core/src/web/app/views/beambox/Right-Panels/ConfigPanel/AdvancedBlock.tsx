import React, { memo, useContext, useEffect, useMemo } from 'react';

import { Collapse, ConfigProvider } from 'antd';

import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import { promarkModels } from '@core/app/actions/beambox/constant';
import { getSupportInfo } from '@core/app/constants/add-on';
import LayerModule from '@core/app/constants/layer-module/layer-modules';
import { LaserType } from '@core/app/constants/promark-constants';
import { getPromarkInfo } from '@core/helpers/device/promark/promark-info';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import { getPromarkLimit } from '@core/helpers/layer/layer-config-helper';
import useForceUpdate from '@core/helpers/use-force-update';
import useI18n from '@core/helpers/useI18n';

import styles from './AdvancedBlock.module.scss';
import AutoFocus from './AutoFocus';
import ConfigPanelContext from './ConfigPanelContext';
import Diode from './Diode';
import DottingTimeBlock from './DottingTimeBlock';
import FocusBlock from './FocusBlock';
import FrequencyBlock from './FrequencyBlock';
import PulseWidthBlock from './PulseWidthBlock';
import SingleColorBlock from './SingleColorBlock';

const AdvancedBlock = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.JSX.Element => {
  const { state } = useContext(ConfigPanelContext);
  const forceUpdate = useForceUpdate();
  const lang = useI18n().beambox.right_panel.laser_panel;
  const workarea = useWorkarea();
  const supportInfo = useMemo(() => getSupportInfo(workarea), [workarea]);
  const isPromark = useMemo(() => promarkModels.has(workarea), [workarea]);
  const promarkInfo = isPromark ? getPromarkInfo() : null;
  const promarkLimit = useMemo(
    () => (promarkInfo ? getPromarkLimit() : null),
    // eslint-disable-next-line hooks/exhaustive-deps
    [promarkInfo?.laserType, promarkInfo?.watt],
  );

  useEffect(() => {
    const canvasEvents = eventEmitterFactory.createEventEmitter('canvas');

    canvasEvents.on('document-settings-saved', forceUpdate);

    return () => {
      canvasEvents.off('document-settings-saved', forceUpdate);
    };
  }, [forceUpdate]);

  const contents = [];

  if (state.module.value !== LayerModule.PRINTER) {
    if (promarkInfo) {
      contents.push(<DottingTimeBlock key="dotting-time-block" type={type} />);

      if (promarkInfo.laserType === LaserType.MOPA) {
        contents.push(
          <PulseWidthBlock
            key="pulse-width-block"
            max={promarkLimit.pulseWidth.max}
            min={promarkLimit.pulseWidth.min}
            type={type}
          />,
        );
      }

      contents.push(
        <FrequencyBlock
          key="frequency-block"
          max={promarkLimit.frequency.max}
          min={promarkLimit.frequency.min}
          type={type}
        />,
      );
    }

    if (supportInfo.lowerFocus) {
      contents.push(<FocusBlock key="focus-block" type={type} />);
    } else if (supportInfo.autoFocus && beamboxPreference.read('enable-autofocus')) {
      contents.push(<AutoFocus key="auto-focus" />);
    }

    if (supportInfo.hybridLaser && beamboxPreference.read('enable-diode')) {
      contents.push(<Diode key="diode" />);
    }
  } else {
    contents.push(<SingleColorBlock key="single-color-block" />);
  }

  if (contents.length === 0) {
    return null;
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
        token: {
          padding: 0,
          paddingSM: 0,
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
            label: lang.advanced,
          },
        ]}
      />
    </ConfigProvider>
  );
};

export default memo(AdvancedBlock);
