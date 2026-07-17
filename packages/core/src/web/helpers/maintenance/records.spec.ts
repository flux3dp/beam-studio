import type { IDeviceInfo } from '@core/interfaces/IDevice';

jest.mock('@core/app/stores/storageStore');

import { setStorage } from '@core/app/stores/storageStore';

import {
  ensureRecord,
  getPrimaryMaterial,
  getRecord,
  machineKeyOf,
  markTaskDone,
  setPrimaryMaterial,
  updateMachineLastUsedAt,
} from './records';

const device = (serial: string, uuid: string): IDeviceInfo =>
  ({ model: 'fbb2', name: 'Studio-A', serial, uuid }) as IDeviceInfo;

beforeEach(() => {
  setStorage('maintenance-records', {});
});

describe('machineKeyOf', () => {
  it('prefers serial and falls back to uuid', () => {
    expect(machineKeyOf(device('SN123', 'uuid-1'))).toBe('SN123');
    expect(machineKeyOf(device('', 'uuid-1'))).toBe('uuid-1');
  });
});

describe('ensureRecord', () => {
  it('creates a record with the strictest default material', () => {
    const record = ensureRecord('SN123', 'fbb2');

    expect(record.machineKey).toBe('SN123');
    expect(record.primaryMaterial).toBe('paper');
    expect(getRecord('SN123')).toEqual(record);
  });
});

describe('markTaskDone', () => {
  it('stamps lastDoneAt/lastResult and appends a history entry', () => {
    const record = markTaskDone('SN123', 'fbb2', 'water', 'done');

    expect(record.tasks.water.lastDoneAt).toBeDefined();
    expect(record.tasks.water.lastResult).toBe('done');
    expect(record.tasks.water.history).toHaveLength(1);
  });

  it('caps history at 5 entries', () => {
    for (let i = 0; i < 10; i += 1) markTaskDone('SN123', 'fbb2', 'water', 'done');

    expect(getRecord('SN123')?.tasks.water.history).toHaveLength(5);
  });

  it('preserves unknown stored task ids on reconciliation', () => {
    ensureRecord('SN123', 'fbb2');
    // simulate a record written by a future schedule version
    getRecord('SN123')!.tasks.future_task = { lastResult: 'done' };
    markTaskDone('SN123', 'fbb2', 'water', 'done');

    expect(getRecord('SN123')?.tasks.future_task).toBeDefined();
  });
});

describe('updateMachineLastUsedAt', () => {
  it('stamps lastUsedAt on an existing record', () => {
    ensureRecord('SN123', 'fbb2');
    updateMachineLastUsedAt('SN123');

    expect(getRecord('SN123')?.lastUsedAt).toBeDefined();
  });

  it('is a no-op when the machine has no record yet', () => {
    updateMachineLastUsedAt('SN999');

    expect(getRecord('SN999')).toBeUndefined();
  });
});

describe('setPrimaryMaterial', () => {
  it('persists the selected material', () => {
    setPrimaryMaterial('SN123', 'fbb2', 'acrylic');

    expect(getPrimaryMaterial(getRecord('SN123'))).toBe('acrylic');
  });
});
