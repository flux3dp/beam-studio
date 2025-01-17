import React, { memo, useContext, useEffect, useMemo } from 'react';
import { Collapse, ConfigProvider } from 'antd';

import beamboxPreference from 'app/actions/beambox/beambox-preference';
import eventEmitterFactory from 'helpers/eventEmitterFactory';
import LayerModule from 'app/constants/layer-module/layer-modules';
import useForceUpdate from 'helpers/use-force-update';
import useI18n from 'helpers/useI18n';
import useWorkarea from 'helpers/hooks/useWorkarea';
import { getPromarkInfo } from 'helpers/device/promark/promark-info';
import { getPromarkLimit } from 'helpers/layer/layer-config-helper';
import { getSupportInfo } from 'app/constants/add-on';
import { LaserType } from 'app/constants/promark-constants';
import { promarkModels } from 'app/actions/beambox/constant';

import AutoFocus from './AutoFocus';
import ConfigPanelContext from './ConfigPanelContext';
import Diode from './Diode';
import DottingTimeBlock from './DottingTimeBlock';
import FocusBlock from './FocusBlock';
import FrequencyBlock from './FrequencyBlock';
import PulseWidthBlock from './PulseWidthBlock';
import SingleColorBlock from './SingleColorBlock';
import styles from './AdvancedBlock.module.scss';

const AdvancedBlock = ({
  type = 'default',
}: {
  type?: 'default' | 'panel-item' | 'modal';
}): JSX.Element => {
  const { state } = useContext(ConfigPanelContext);
  const forceUpdate = useForceUpdate();
  const lang = useI18n().beambox.right_panel.laser_panel;
  const workarea = useWorkarea();
  const supportInfo = useMemo(() => getSupportInfo(workarea), [workarea]);
  const isPromark = useMemo(() => promarkModels.has(workarea), [workarea]);
  const promarkInfo = isPromark ? getPromarkInfo() : null;
  const promarkLimit = useMemo(
    () => (promarkInfo ? getPromarkLimit() : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [promarkInfo?.laserType, promarkInfo?.watt]
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
      if (promarkInfo.laserType === LaserType.MOPA)
        contents.push(
          <PulseWidthBlock
            key="pulse-width-block"
            type={type}
            min={promarkLimit.pulseWidth.min}
            max={promarkLimit.pulseWidth.max}
          />
        );
      contents.push(
        <FrequencyBlock
          key="frequency-block"
          type={type}
          min={promarkLimit.frequency.min}
          max={promarkLimit.frequency.max}
        />
      );
    }
    if (supportInfo.lowerFocus) {
      contents.push(<FocusBlock type={type} key="focus-block" />);
    } else if (supportInfo.autoFocus && beamboxPreference.read('enable-autofocus')) {
      contents.push(<AutoFocus key="auto-focus" />);
    }

    if (supportInfo.hybridLaser && beamboxPreference.read('enable-diode')) {
      contents.push(<Diode key="diode" />);
    }
  } else {
    contents.push(<SingleColorBlock key="single-color-block" />);
  }

  if (contents.length === 0) return null;
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
        ghost
        defaultActiveKey={[]}
        items={[
          {
            key: '1',
            label: lang.advanced,
            children: <div className={styles.panel}>{contents}</div>,
          },
        ]}
      />
    </ConfigProvider>
  );
};

export default memo(AdvancedBlock);
