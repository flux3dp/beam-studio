import dayjs from 'dayjs';
import { sprintf } from 'sprintf-js';

import type { Cadence, MaintenanceTask, MaterialKey } from '@core/app/constants/maintenance';
import type { ILang } from '@core/interfaces/ILang';

import type { TaskRecord } from './records';

export type MaintenanceStatus = 'duesoon' | 'never' | 'ok' | 'overdue';

const UNIT_DAYS: Record<'day' | 'month' | 'week', number> = { day: 1, month: 30, week: 7 };

/**
 * Interval length in days for cadences that have one. `condition` cadences return
 * undefined (they are never clock-due). `per_operation` proxies to `proxyDays`.
 */
export const intervalDays = (cadence: Cadence, material: MaterialKey): number | undefined => {
  switch (cadence.kind) {
    case 'condition':
      return undefined;
    case 'per_operation':
      return cadence.proxyDays ?? 1;
    case 'time':
      return cadence.every * UNIT_DAYS[cadence.unit];
    case 'time_by_material': {
      const { every, unit } = cadence.map[material];

      return every * UNIT_DAYS[unit];
    }
    default:
      return undefined;
  }
};

/** due-soon window = clamp(15% of interval, min 1 day, max 14 days). */
export const dueSoonWindow = (interval: number): number => Math.min(Math.max(1, interval * 0.15), 14, interval * 0.5);

/** Computes the next-due dayjs for a task, or null when the cadence has no clock. */
export const nextDue = (
  record: TaskRecord | undefined,
  task: MaintenanceTask,
  material: MaterialKey,
): dayjs.Dayjs | null => {
  const interval = intervalDays(task.cadence, material);

  if (interval === undefined || !record?.lastDoneAt) return null;

  return dayjs(record.lastDoneAt).add(interval, 'day');
};

/** Derives the status shown for a task. */
export const statusOf = (
  record: TaskRecord | undefined,
  task: MaintenanceTask,
  material: MaterialKey,
): MaintenanceStatus => {
  // Nothing ever recorded → never, regardless of task type.
  if (!record || !record.lastDoneAt) return 'never';

  if (task.actionType === 'passfail') {
    return record.lastResult! === 'fail' ? 'overdue' : 'ok';
  }

  // Condition tasks have no clock: any recorded action counts as ok.
  if (task.cadence.kind === 'condition') return 'ok';

  const due = nextDue(record, task, material);

  if (!due) return 'ok';

  const interval = intervalDays(task.cadence, material) ?? 0;
  const window = dueSoonWindow(interval);
  const diffDays = due.diff(dayjs(), 'day', true);

  if (diffDays <= 0) return 'overdue';

  if (diffDays <= window) return 'duesoon';

  return 'ok';
};

type CadenceLang = ILang['maintenance']['cadence'];

/** Localized cadence label. `time_by_material` is rendered as an inline dropdown in the row. */
export const formatCadence = (cadence: Cadence, cadenceLang: CadenceLang): string => {
  if (cadence.kind !== 'per_operation' && cadence.kind !== 'time_by_material' && cadence.displayKey) {
    return cadenceLang[cadence.displayKey as keyof CadenceLang] ?? '';
  }

  switch (cadence.kind) {
    case 'condition':
      return cadenceLang.condition;
    case 'per_operation':
      return cadenceLang.each_operation;
    case 'time': {
      const plural = cadence.every > 1;
      const template = cadenceLang[`${cadence.unit}${plural ? 's' : ''}` as keyof CadenceLang] ?? '';

      return sprintf(template, cadence.every).trim();
    }
    case 'time_by_material':
      return cadenceLang.by_material;
    default:
      return '';
  }
};
