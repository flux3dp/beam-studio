import React, { memo, useEffect, useMemo } from 'react';

import { Collapse, ConfigProvider } from 'antd';

import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import { promarkModels } from '@core/app/actions/beambox/constant';
import { getAddOnInfo } from '@core/app/constants/addOn';
import { printingModules } from '@core/app/constants/layer-module/layer-modules';
import { LaserType } from '@core/app/constants/promark-constants';
import { useConfigPanelStore } from '@core/app/stores/configPanel';
import { getPromarkInfo } from '@core/helpers/device/promark/promark-info';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import useHasCurveEngraving from '@core/helpers/hooks/useHasCurveEngraving';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import { getPromarkLimit } from '@core/helpers/layer/layer-config-helper';
import useForceUpdate from '@core/helpers/use-force-update';
import useI18n from '@core/helpers/useI18n';

import styles from './AdvancedBlock.module.scss';
import AutoFocus from './AutoFocus';
import CurveEngravingZHighSpeed from './CurveEngravingZHighSpeed';
import Diode from './Diode';
import FocusBlock from './FocusBlock';
import FrequencyBlock from './FrequencyBlock';
import PulseWidthBlock from './PulseWidthBlock';
import SingleColorBlock from './SingleColorBlock';
import WobbleBlock from './WobbleBlock';

const AdvancedBlock = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.ReactNode => {
  const { module } = useConfigPanelStore();
  const forceUpdate = useForceUpdate();
  const lang = useI18n().beambox.right_panel.laser_panel;
  const workarea = useWorkarea();
  const hasCurveEngraving = useHasCurveEngraving();
  const addOnInfo = useMemo(() => getAddOnInfo(workarea), [workarea]);
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

  if (!printingModules.has(module.value)) {
    if (promarkInfo && promarkLimit) {
      if (promarkInfo.laserType === LaserType.MOPA) {
        contents.push(
          <PulseWidthBlock
            key="pulse-width-block"
            max={promarkLimit.pulseWidth!.max}
            min={promarkLimit.pulseWidth!.min}
            type={type}
          />,
        );
      }

      contents.push(
        <FrequencyBlock
          key="frequency-block"
          max={promarkLimit.frequency!.max}
          min={promarkLimit.frequency!.min}
          type={type}
        />,
        <WobbleBlock key="wobble-block" />,
      );
    }

    if (hasCurveEngraving) {
      contents.push(<CurveEngravingZHighSpeed key="curve-engraving-z-high-speed" />);
    } else {
      if (addOnInfo.lowerFocus) {
        contents.push(<FocusBlock key="focus-block" type={type} />);
      } else if (addOnInfo.autoFocus && beamboxPreference.read('enable-autofocus')) {
        contents.push(<AutoFocus key="auto-focus" />);
      }
    }

    if (addOnInfo.hybridLaser && beamboxPreference.read('enable-diode')) {
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
