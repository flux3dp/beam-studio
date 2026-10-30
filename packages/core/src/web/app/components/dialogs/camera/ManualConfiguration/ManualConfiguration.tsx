import React, { useEffect, useMemo, useState } from 'react';

import { Tabs } from 'antd';

import { getWorkarea } from '@core/app/constants/workarea-constants';
import DraggableModal from '@core/app/widgets/DraggableModal';
import useI18n from '@core/helpers/useI18n';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import { fetchPncOffset } from '../../PrintAndCut/calibration/offsetStore';

import CameraTab from './CameraTab';
import styles from './ManualConfiguration.module.scss';
import ModulesTab from './ModulesTab';
import PrintAndCutTab from './PrintAndCutTab';
import { tabSavers, useManualConfigStore } from './store';
import { getManualConfigurationTabs } from './tabs';

export interface ManualConfigurationProps {
  device: IDeviceInfo;
  onClose: () => void;
}

const TAB_KEYS = ['camera', 'modules', 'printAndCut'] as const;

const ManualConfiguration = ({ device, onClose }: ManualConfigurationProps): React.JSX.Element => {
  const { global: tGlobal, manual_config: t } = useI18n();
  const tabs = useMemo(() => getManualConfigurationTabs(device.model), [device.model]);
  const [activeKey, setActiveKey] = useState<string>(() => TAB_KEYS.find((key) => tabs[key]) ?? 'printAndCut');
  const [saving, setSaving] = useState(false);
  // blocks register their savers in the store; the footer button acts on the active tab's
  const savers = tabSavers(
    useManualConfigStore((state) => state.savers),
    activeKey,
  );
  const canSave = savers.some((saver) => saver.changed);

  useEffect(() => {
    // the store outlives the modal: a fetch that lands after close must not seed the next device's modal
    let active = true;

    fetchPncOffset(device.serial).then((pnc) => {
      if (active) useManualConfigStore.getState().setPnc(pnc);
    });

    return () => {
      active = false;
      useManualConfigStore.getState().reset();
    };
  }, [device.serial]);

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const saver of savers) if (saver.changed) await saver.save();
    } finally {
      setSaving(false);
    }
  };

  // each tab owns its own loading and Save; the modal only hosts them
  const items = [
    ...(tabs.camera
      ? [
          {
            children: <CameraTab device={device} />,
            key: 'camera',
            label: t.tab_camera,
          },
        ]
      : []),
    ...(tabs.modules
      ? [
          {
            children: <ModulesTab model={device.model} />,
            key: 'modules',
            label: t.tab_modules,
          },
        ]
      : []),
    ...(tabs.printAndCut
      ? [
          {
            children: <PrintAndCutTab serial={device.serial} />,
            key: 'printAndCut',
            label: t.tab_print_and_cut,
          },
        ]
      : []),
  ];

  return (
    <DraggableModal
      cancelText={tGlobal.cancel}
      okButtonProps={{ disabled: !canSave, loading: saving }}
      okText={tGlobal.save}
      onCancel={onClose}
      onOk={handleSave}
      open
      title={
        <>
          {t.title}
          <div className={styles.subtitle}>{`${device.name} (${getWorkarea(device.model).label})`}</div>
        </>
      }
      width={720}
    >
      <Tabs activeKey={activeKey} className={styles.tabs} items={items} onChange={setActiveKey} />
    </DraggableModal>
  );
};

export default ManualConfiguration;
