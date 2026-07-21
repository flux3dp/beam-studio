import type { MaintenanceSchedule, MaterialKey } from '@core/app/constants/maintenance';

import { statusOf } from './dueStatus';
import type { MachineMaintenanceRecord } from './records';

export interface EssentialCounts {
  allOk: boolean;
  ok: number;
  /** Strictly `overdue` — a never-serviced essential is `never`, not overdue, so it isn't counted. */
  overdue: number;
  total: number;
}

/** Essential-task health for a machine: how many essential tasks are currently OK / overdue. */
export const essentialCounts = (
  schedule: MaintenanceSchedule,
  record: MachineMaintenanceRecord | undefined,
  material: MaterialKey,
): EssentialCounts => {
  const statuses = schedule.tasks
    .filter((task) => task.essential)
    .map((task) => statusOf(record?.tasks[task.id], task, material, record?.lastUsedAt));
  const ok = statuses.filter((status) => status === 'ok').length;

  return {
    allOk: statuses.length > 0 && ok === statuses.length,
    ok,
    overdue: statuses.filter((status) => status === 'overdue').length,
    total: statuses.length,
  };
};
