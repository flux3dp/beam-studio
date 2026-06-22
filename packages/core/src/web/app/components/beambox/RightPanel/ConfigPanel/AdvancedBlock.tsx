import React, { memo, useMemo } from 'react';

import { Collapse, ConfigProvider } from 'antd';
import { useShallow } from 'zustand/react/shallow';

import { promarkModels } from '@core/app/actions/beambox/constant';
import { getAddOnInfo } from '@core/app/constants/addOn';
import { LayerModule, printingModules } from '@core/app/constants/layer-module/layer-modules';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useConfigPanelStore } from '@core/app/stores/configPanel';
import { useCurveEngravingStore } from '@core/app/stores/curveEngravingStore';
import { useDocumentStore } from '@core/app/stores/documentStore';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import useI18n from '@core/helpers/useI18n';

import styles from './AdvancedBlock.module.scss';
import AmDensityBlock from './AmDensityBlock';
import AutoFocus from './AutoFocus';
import CurveEngravingZHighSpeed from './CurveEngravingZHighSpeed';
import Diode from './Diode';
import FocusBlock from './FocusBlock';
import RefreshIntervalBlock from './RefreshIntervalBlock';
import SingleColorBlock from './SingleColorBlock';
import TextureBlock from './TextureBlock';

const AdvancedBlock = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.ReactNode => {
  const { module } = useConfigPanelStore();
  const lang = useI18n().beambox.right_panel.laser_panel;
  const workarea = useWorkarea();
  const hasCurveEngraving = useCurveEngravingStore((state) => state.hasData);
  const { addOnInfo, workareaObject } = useMemo(
    () => ({ addOnInfo: getAddOnInfo(workarea), workareaObject: getWorkarea(workarea) }),
    [workarea],
  );
  const isPromark = useMemo(() => promarkModels.has(workarea), [workarea]);
  const { isAutoFocusEnabled, isDiodeEnabled } = useDocumentStore(
    useShallow((state) => ({
      isAutoFocusEnabled: state['enable-autofocus'],
      isDiodeEnabled: state['enable-diode'],
    })),
  );

  // Promark advanced settings are presented as a button + modal (AdvancedSettingButton) instead
  if (isPromark) return null;

  const contents = [];

  if (!printingModules.has(module.value)) {
    if (hasCurveEngraving) {
      if (workareaObject.curveSpeedLimit?.zRegular) {
        contents.push(<CurveEngravingZHighSpeed key="curve-engraving-z-high-speed" type={type} />);
      }
    } else {
      if (addOnInfo.lowerFocus) {
        contents.push(<FocusBlock isPromark={isPromark} key="focus-block" type={type} />);
      } else if (addOnInfo.autoFocus && isAutoFocusEnabled) {
        contents.push(<AutoFocus key="auto-focus" type={type} />);
      }
    }

    if (addOnInfo.hybridLaser && isDiodeEnabled) {
      contents.push(<Diode key="diode" type={type} />);
    }

    if (workarea !== 'fuv1') {
      contents.push(<TextureBlock key="texture-block" type={type} />);
    }
  } else {
    if (module.value === LayerModule.PRINTER_4C) {
      contents.push(<AmDensityBlock key="am-density-block" type={type} />);
      contents.push(<RefreshIntervalBlock key="refresh-interval-block" type={type} />);
    }

    contents.push(<SingleColorBlock key="single-color-block" type={type} />);
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
