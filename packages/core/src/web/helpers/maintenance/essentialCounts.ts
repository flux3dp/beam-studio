import type { MaintenanceSchedule, MaterialKey } from '@core/app/constants/maintenance';

import { statusOf } from './dueStatus';
import type { MachineMaintenanceRecord } from './records';

export interface EssentialCounts {
  allOk: boolean;
  ok: number;
  total: number;
}

/** Essential-task health for a machine: how many essential tasks are currently OK. */
export const essentialCounts = (
  schedule: MaintenanceSchedule,
  record: MachineMaintenanceRecord | undefined,
  material: MaterialKey,
): EssentialCounts => {
  const essentials = schedule.tasks.filter((task) => task.essential);
  const ok = essentials.filter((task) => statusOf(record?.tasks[task.id], task, material) === 'ok').length;

  return { allOk: essentials.length > 0 && ok === essentials.length, ok, total: essentials.length };
};
