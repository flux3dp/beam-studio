import React, { memo, useEffect, useMemo } from 'react';

import { Collapse, ConfigProvider } from 'antd';
import { useShallow } from 'zustand/react/shallow';

import { promarkModels } from '@core/app/actions/beambox/constant';
import { getAddOnInfo } from '@core/app/constants/addOn';
import { LayerModule, printingModules } from '@core/app/constants/layer-module/layer-modules';
import { LaserType } from '@core/app/constants/promark-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useConfigPanelStore } from '@core/app/stores/configPanel';
import { useCurveEngravingStore } from '@core/app/stores/curveEngravingStore';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { getPromarkInfo } from '@core/helpers/device/promark/promark-info';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import isDev from '@core/helpers/is-dev';
import { getPromarkLimit } from '@core/helpers/layer/layer-config-helper';
import useForceUpdate from '@core/helpers/use-force-update';
import useI18n from '@core/helpers/useI18n';
import type { CommonProps } from '@core/interfaces/ConfigOption';

import styles from './AdvancedBlock.module.scss';
import AmDensityBlock from './AmDensityBlock';
import AutoFocus from './AutoFocus';
import ColorAdvancedSettingButton from './ColorAdvancedSetting/ColorAdvancedSettingButton';
import CurveEngravingZHighSpeed from './CurveEngravingZHighSpeed';
import Diode from './Diode';
import FocusBlock from './FocusBlock';
import FrequencyBlock from './FrequencyBlock';
import NozzleBlock from './NozzleBlock';
import PulseWidthBlock from './PulseWidthBlock';
import RefreshIntervalBlock from './RefreshIntervalBlock';
import RefreshThresholdBlock from './RefreshThresholdBlock';
import SCurveBlock from './SCurveBlock';
import SingleColorBlock from './SingleColorBlock';
import WobbleBlock from './WobbleBlock';

const AdvancedBlock = (props: CommonProps): React.ReactNode => {
  const { module } = useConfigPanelStore();
  const forceUpdate = useForceUpdate();
  const lang = useI18n().beambox.right_panel.laser_panel;
  const workarea = useWorkarea();
  const hasCurveEngraving = useCurveEngravingStore((state) => state.hasData);
  const { addOnInfo, workareaObject } = useMemo(
    () => ({ addOnInfo: getAddOnInfo(workarea), workareaObject: getWorkarea(workarea) }),
    [workarea],
  );
  const isPromark = useMemo(() => promarkModels.has(workarea), [workarea]);
  const promarkInfo = isPromark ? getPromarkInfo() : null;
  const promarkLimit = useMemo(
    () => (promarkInfo ? getPromarkLimit() : null),
    // eslint-disable-next-line hooks/exhaustive-deps
    [promarkInfo?.laserType, promarkInfo?.watt],
  );
  const { isAutoFocusEnabled, isDiodeEnabled } = useDocumentStore(
    useShallow((state) => ({
      isAutoFocusEnabled: state['enable-autofocus'],
      isDiodeEnabled: state['enable-diode'],
    })),
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
            {...props}
          />,
        );
      }

      contents.push(
        <FrequencyBlock
          key="frequency-block"
          max={promarkLimit.frequency!.max}
          min={promarkLimit.frequency!.min}
          {...props}
        />,
        <WobbleBlock key="wobble-block" {...props} />,
      );
    }

    if (hasCurveEngraving) {
      if (workareaObject.curveSpeedLimit?.zRegular) {
        contents.push(<CurveEngravingZHighSpeed key="curve-engraving-z-high-speed" {...props} />);
      }
    } else {
      if (addOnInfo.lowerFocus) {
        contents.push(<FocusBlock key="focus-block" {...props} />);
      } else if (addOnInfo.autoFocus && isAutoFocusEnabled) {
        contents.push(<AutoFocus key="auto-focus" {...props} />);
      }
    }

    if (addOnInfo.hybridLaser && isDiodeEnabled) {
      contents.push(<Diode key="diode" {...props} />);
    }

    if (isDev() && (workarea === 'fhx2rf' || workarea === 'fbb2')) {
      contents.push(<SCurveBlock key="s-curve-block" {...props} />);
    }
  } else {
    if (module.value === LayerModule.PRINTER_4C) {
      contents.push(<AmDensityBlock key="am-density-block" {...props} />);
      contents.push(<RefreshIntervalBlock key="refresh-interval-block" {...props} />);

      if (isDev()) {
        contents.push(<ColorAdvancedSettingButton key="color-advanced-setting-button" {...props} />);
        contents.push(<RefreshThresholdBlock key="refresh-threshold-block" {...props} />);
        contents.push(<NozzleBlock key="nozzle-block" {...props} />);
      }
    }

    contents.push(<SingleColorBlock key="single-color-block" {...props} />);
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
