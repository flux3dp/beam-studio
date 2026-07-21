import { useMemo } from 'react';

import type { MaintenanceSchedule, MaterialKey } from '@core/app/constants/maintenance';
import { getScheduleForModel, strictestMaterial } from '@core/app/constants/maintenance';
import { useStorageStore } from '@core/app/stores/storageStore';
import { essentialCounts } from '@core/helpers/maintenance/essentialCounts';
import type { MachineMaintenanceRecord } from '@core/helpers/maintenance/records';

import { useMaintenanceStore } from './useMaintenanceStore';
import type { Selection } from './utils';
import { modelLabel } from './utils';

interface MaintenanceData {
  health: { allOk: boolean; ok: number; total: number };
  machineName: string;
  material: MaterialKey;
  record: MachineMaintenanceRecord | undefined;
  schedule: MaintenanceSchedule | undefined;
  selection: Selection | undefined;
}

/**
 * The selected machine's checklist data, derived from the resolved `selection` plus the persisted
 * `maintenance-records`. Free of `useDeviceList`, so any child may call it — and it is called often
 * (once per `TaskRow`, among others), hence the memo.
 */
export const useMaintenanceData = (): MaintenanceData => {
  const selection = useMaintenanceStore((state) => state.selection);
  const records = useStorageStore((state) => state['maintenance-records']);

  return useMemo<MaintenanceData>(() => {
    const record = selection ? records?.[selection.key] : undefined;
    const material: MaterialKey = record?.primaryMaterial ?? strictestMaterial;
    const schedule = selection ? getScheduleForModel(selection.model) : undefined;
    const machineName = selection?.nickname ?? (selection ? modelLabel(selection.model) : '');
    const health = schedule ? essentialCounts(schedule, record, material) : { allOk: false, ok: 0, total: 0 };

    return { health, machineName, material, record, schedule, selection };
  }, [records, selection]);
};
