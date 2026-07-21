import React, { useLayoutEffect, useMemo, useState } from 'react';

import TopBarController from '@core/app/components/beambox/TopBar/contexts/TopBarController';
import { modelsWithSchedule } from '@core/app/constants/maintenance';
import { workareaOptions } from '@core/app/constants/workarea-constants';
import { useStorageStore } from '@core/app/stores/storageStore';
import Select from '@core/app/widgets/AntdSelect';
import { useDeviceList } from '@core/helpers/hooks/useDeviceList';
import { machineKeyOf } from '@core/helpers/maintenance/records';
import useI18n from '@core/helpers/useI18n';

import { useMaintenanceStore } from '../useMaintenanceStore';
import type { Selection } from '../utils';
import { modelLabel } from '../utils';

import styles from './MachineSelect.module.scss';

/** Machine keys built for models that have a schedule but no connected/known device. */
const MODEL_PREFIX = 'model:';

/**
 * Models offerable as bare (unowned) entries. `workareaOptions` is already region/platform
 * gated via `checkFeature`, so deriving from it keeps this in step with the rest of the app.
 * Connected and previously-seen machines bypass this — the user owns them regardless of region.
 */
const availableModels = new Set(workareaOptions.map(({ value }) => value));

/**
 * Owns the machine roster: the sole `useDeviceList` subscriber, and the only place that knows how a
 * key resolves to a machine. The roster and the user's pick stay local; only the resolved
 * `Selection` is published to the store, since the rest of the dialog spans two antd portals.
 */
const MachineSelect = (): React.JSX.Element => {
  const t = useI18n().maintenance;
  const devices = useDeviceList('maintenance-checklist');
  const records = useStorageStore((state) => state['maintenance-records']);
  const setSelection = useMaintenanceStore((state) => state.setSelection);
  // A seed, not a subscription: after mount the user's pick is the only thing that moves this.
  const [currentKey, setCurrentKey] = useState(() => useMaintenanceStore.getState().initialMachineKey);

  const { mineDevices, otherModels } = useMemo<{ mineDevices: Selection[]; otherModels: Selection[] }>(() => {
    const connected: Selection[] = devices.map((device) => ({
      key: machineKeyOf(device),
      model: device.model,
      nickname: device.name,
    }));
    const connectedKeys = new Set(connected.map((selection) => selection.key));
    const known: Selection[] = Object.values(records ?? {})
      .filter((record) => !record.machineKey.startsWith(MODEL_PREFIX) && !connectedKeys.has(record.machineKey))
      .map((record) => ({ key: record.machineKey, model: record.model, nickname: record.nickname }));
    const mineDevices = [...connected, ...known];
    const coveredModels = new Set(mineDevices.map((selection) => selection.model));
    const models: Selection[] = modelsWithSchedule
      .filter((model) => !coveredModels.has(model) && availableModels.has(model))
      .map((model) => ({ key: `${MODEL_PREFIX}${model}`, model }));

    return { mineDevices, otherModels: models };
  }, [devices, records]);

  const selection = useMemo<Selection | undefined>(() => {
    const selections = [...mineDevices, ...otherModels];
    const byKey = selections.find((item) => item.key === currentKey);

    if (byKey) return byKey;

    // Default to the connected device, else the first known machine / model.
    const selected = TopBarController.getSelectedDevice();
    const selectedKey = selected ? machineKeyOf(selected) : undefined;

    return selections.find((item) => item.key === selectedKey) ?? selections[0];
  }, [currentKey, mineDevices, otherModels]);

  // Layout effect, not effect: the roster is never empty, so publishing after paint would flash
  // `Body`'s empty state for a frame. Writing to the store during render isn't safe under
  // concurrent React, so commit-time is the earliest correct moment.
  useLayoutEffect(() => {
    setSelection(selection);
  }, [selection, setSelection]);

  const machineOptions = useMemo(() => {
    const toOption = (item: Selection) => ({
      label: item.nickname ? `${item.nickname} — ${modelLabel(item.model)}` : modelLabel(item.model),
      value: item.key,
    });

    return [
      { label: t.machine_groups.my_machines, options: mineDevices.map(toOption) },
      { label: t.machine_groups.other_models, options: otherModels.map(toOption) },
    ].filter((group) => group.options.length > 0);
  }, [mineDevices, otherModels, t]);

  return (
    <div className={styles.machine}>
      <span className={styles.label}>{t.machine_label}</span>
      <Select className={styles.select} onChange={setCurrentKey} options={machineOptions} value={selection?.key} />
    </div>
  );
};

export default MachineSelect;
