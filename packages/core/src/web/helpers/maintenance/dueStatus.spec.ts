import dayjs from 'dayjs';

import type { Cadence, MaintenanceTask } from '@core/app/constants/maintenance';

import type { TaskRecord } from './records';
import { dueSoonWindow, intervalDays, statusOf } from './dueStatus';

const makeTask = (cadence: Cadence, overrides: Partial<MaintenanceTask> = {}): MaintenanceTask => ({
  actionType: 'done',
  area: 'working_area',
  cadence,
  essential: false,
  id: 'test',
  langKey: 'maintain_test',
  ...overrides,
});

const daysAgo = (days: number): TaskRecord => ({ lastDoneAt: dayjs().subtract(days, 'day').toISOString() });

describe('intervalDays', () => {
  it('computes time cadence in days', () => {
    expect(intervalDays({ every: 2, kind: 'time', unit: 'week' }, 'acrylic')).toBe(14);
    expect(intervalDays({ every: 3, kind: 'time', unit: 'month' }, 'acrylic')).toBe(90);
  });

  it('uses the selected material for time_by_material', () => {
    const cadence: Cadence = {
      kind: 'time_by_material',
      map: {
        acrylic: { every: 1, unit: 'week' },
        leather: { every: 2, unit: 'week' },
        paper: { every: 1, unit: 'day' },
        wood: { every: 2, unit: 'week' },
      },
    };

    expect(intervalDays(cadence, 'paper')).toBe(1);
    expect(intervalDays(cadence, 'acrylic')).toBe(7);
  });

  it('proxies per_operation to proxyDays (default 1)', () => {
    expect(intervalDays({ kind: 'per_operation' }, 'acrylic')).toBe(1);
    expect(intervalDays({ kind: 'per_operation', proxyDays: 3 }, 'acrylic')).toBe(3);
  });

  it('returns undefined for condition cadence', () => {
    expect(intervalDays({ kind: 'condition' }, 'acrylic')).toBeUndefined();
  });
});

describe('dueSoonWindow (PRD D11: clamp 15%, min 1, max 14)', () => {
  it('clamps to a minimum of 1 day for short intervals', () => {
    expect(dueSoonWindow(4)).toBe(1);
  });

  it('uses 15% for mid-range intervals', () => {
    expect(dueSoonWindow(60)).toBeCloseTo(9);
  });

  it('caps at 14 days for long intervals', () => {
    expect(dueSoonWindow(200)).toBe(14);
  });
});

describe('statusOf', () => {
  it('returns never when there is no record', () => {
    expect(statusOf(undefined, makeTask({ every: 2, kind: 'time', unit: 'week' }), 'acrylic')).toBe('never');
  });

  it('returns ok well before the due date', () => {
    expect(statusOf(daysAgo(1), makeTask({ every: 2, kind: 'time', unit: 'week' }), 'acrylic')).toBe('ok');
  });

  it('returns duesoon within the window', () => {
    expect(statusOf(daysAgo(13), makeTask({ every: 2, kind: 'time', unit: 'week' }), 'acrylic')).toBe('duesoon');
  });

  it('returns overdue past the due date', () => {
    expect(statusOf(daysAgo(20), makeTask({ every: 2, kind: 'time', unit: 'week' }), 'acrylic')).toBe('overdue');
  });

  it('derives passfail status from lastResult', () => {
    const task = makeTask({ kind: 'condition' }, { actionType: 'passfail' });

    expect(statusOf({ lastResult: 'pass' }, task, 'acrylic')).toBe('ok');
    expect(statusOf({ lastResult: 'fail' }, task, 'acrylic')).toBe('overdue');
    expect(statusOf(undefined, task, 'acrylic')).toBe('never');
  });

  it('marks condition (check) tasks ok once checked, never otherwise', () => {
    const task = makeTask({ kind: 'condition' }, { actionType: 'check' });

    expect(statusOf({ lastDoneAt: dayjs().toISOString() }, task, 'acrylic')).toBe('ok');
    expect(statusOf(undefined, task, 'acrylic')).toBe('never');
  });
});
