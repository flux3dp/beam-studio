import type { MaterialKey } from '@core/app/constants/maintenance';
import { strictestMaterial } from '@core/app/constants/maintenance';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getStorage, setStorage } from '@core/app/stores/storageStore';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

export type TaskResult = 'checked' | 'done' | 'fail' | 'pass';

export interface TaskHistoryEntry {
  at: string;
  by?: string;
  result: TaskResult;
}

export interface TaskRecord {
  history?: TaskHistoryEntry[];
  lastDoneAt?: string;
  lastResult?: TaskResult;
}

export interface MachineMaintenanceRecord {
  /** Serial (preferred) or UUID. */
  machineKey: string;
  model: WorkAreaModel;
  nickname?: string;
  primaryMaterial?: MaterialKey;
  tasks: Record<string, TaskRecord>;
}

const STORAGE_KEY = 'maintenance-records';

/** Max history entries kept (and shown) per task; older ones are dropped on write. */
export const HISTORY_CAP = 5;

/** Stable per-machine key: serial preferred (survives UUID churn), UUID fallback. */
export const machineKeyOf = (device: IDeviceInfo): string => device.serial || device.uuid;

const readAll = (): Record<string, MachineMaintenanceRecord> => getStorage(STORAGE_KEY) || {};

// Spread into a fresh map reference so storageStore subscribers (e.g. the dialog) re-render.
const writeAll = (all: Record<string, MachineMaintenanceRecord>): void => {
  setStorage(STORAGE_KEY, { ...all });
};

export const getRecord = (machineKey: string): MachineMaintenanceRecord | undefined => readAll()[machineKey];
/**
 * Returns the record for a machine, creating a fresh one if absent. Unknown stored task
 * ids are preserved on reconciliation since we never delete the tasks map.
 */
export const ensureRecord = (machineKey: string, model: WorkAreaModel, nickname?: string): MachineMaintenanceRecord => {
  const all = readAll();
  const currentRecord = all[machineKey];

  if (currentRecord) {
    // Keep nickname fresh when the machine reports one.
    if (nickname && currentRecord.nickname !== nickname) {
      currentRecord.nickname = nickname;
      writeAll(all);
    }

    return currentRecord;
  }

  const record: MachineMaintenanceRecord = {
    machineKey,
    model,
    nickname,
    primaryMaterial: strictestMaterial,
    tasks: {},
  };

  all[machineKey] = record;
  writeAll(all);

  return record;
};

export const saveRecord = (record: MachineMaintenanceRecord): void => {
  const all = readAll();

  all[record.machineKey] = record;
  writeAll(all);
};

/** Records a task action: stamps lastDoneAt/lastResult and appends a capped history entry. */
export const markTaskDone = (
  machineKey: string,
  model: WorkAreaModel,
  taskId: string,
  result: TaskResult,
  by?: string,
): MachineMaintenanceRecord => {
  const record = ensureRecord(machineKey, model);
  const at = new Date().toISOString();
  const prev = record.tasks[taskId] ?? {};
  const history = [{ at, by, result }, ...(prev.history ?? [])].slice(0, HISTORY_CAP);

  record.tasks[taskId] = { ...prev, history, lastDoneAt: at, lastResult: result };
  saveRecord(record);

  return record;
};

export const setPrimaryMaterial = (
  machineKey: string,
  model: WorkAreaModel,
  material: MaterialKey,
): MachineMaintenanceRecord => {
  const record = ensureRecord(machineKey, model);

  record.primaryMaterial = material;
  saveRecord(record);

  return record;
};

export const getPrimaryMaterial = (record: MachineMaintenanceRecord | undefined): MaterialKey =>
  record?.primaryMaterial ?? strictestMaterial;
