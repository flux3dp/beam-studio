import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import type { ILang } from '@core/interfaces/ILang';

/**
 * Declarative maintenance schedule model. Checklists are authored as one area-grouped
 * task catalog (`tasks.ts`); each task declares which models it applies to, and a
 * per-model `MaintenanceSchedule` is synthesized on demand (`index.ts`).
 */

export type MaintenanceTaskKey = keyof ILang['maintenance']['tasks'];
type MaintenanceCadenceKey = keyof ILang['maintenance']['cadence'];

export const materialKeys = ['wood', 'acrylic', 'leather', 'paper'] as const;
export type MaterialKey = (typeof materialKeys)[number];

/** Strictest (shortest interval) material — used as the default so we never under-warn. */
export const strictestMaterial: MaterialKey = 'paper';

export type MaintenanceArea = 'back_cover' | 'modules' | 'optics' | 'panel' | 'working_area';

/**
 * Canonical area order. Each model's `areaOrder` is this list filtered to the areas it
 * actually uses — reproduces every model's original ordering.
 */
export const GLOBAL_AREA_ORDER: MaintenanceArea[] = ['panel', 'working_area', 'modules', 'optics', 'back_cover'];

export type TimeUnit = 'day' | 'month' | 'week';

interface TimeInterval {
  every: number;
  unit: TimeUnit;
}

/**
 * Cadence is a tagged union so a single status engine handles every interval type.
 * `displayKey` optionally overrides the auto-generated cadence label (e.g. "Every 1–2 weeks").
 */
export type Cadence =
  | (TimeInterval & { displayKey?: MaintenanceCadenceKey; kind: 'time' })
  | { displayKey?: MaintenanceCadenceKey; kind: 'condition' }
  | { kind: 'per_operation'; proxyDays?: number }
  | { kind: 'time_by_material'; map: Record<MaterialKey, TimeInterval> };

export type MaintenanceActionType = 'check' | 'done' | 'passfail';

/** A task as consumers see it after `getScheduleForModel` resolves model targeting + overrides. */
export interface MaintenanceTask {
  /** Controls the row's primary action. */
  actionType: MaintenanceActionType;
  /** Drives grouping; must be present in the schedule's `areaOrder`. */
  area: MaintenanceArea;
  cadence: Cadence;
  /** ★ flag — counts toward machine health and reminders. */
  essential: boolean;
  helpUrl?: string;
  /** Stable key used in stored records — never reuse or rename. */
  id: string;
  /** Resolved key into the flat `maintenance.tasks` i18n dictionary. */
  langKey: MaintenanceTaskKey;
}

/**
 * Authoring shape in the catalog (`tasks.ts`). Adds model targeting and per-model text
 * overrides; `getScheduleForModel` resolves these down to a plain `MaintenanceTask`.
 * A logical task whose config (cadence/area/actionType) differs by model is written as
 * multiple entries sharing the same `id` but disjoint model targets.
 */
export interface MaintenanceTaskDef extends Omit<MaintenanceTask, 'helpUrl' | 'langKey'> {
  /** Applies to all scheduled models except these (mutually exclusive with `models`). */
  excludeModels?: WorkAreaModel[];
  /** Per-model Help Center article id override, e.g. `{ fhx2rf: '12345' }`; falls back to the model's guide article. */
  helpArticleIds?: Partial<Record<WorkAreaModel, string>>;
  /** Default i18n key. */
  langKey: MaintenanceTaskKey;
  /** Per-model text override, e.g. `{ fhx2rf: 'honeycomb_plate' }`. */
  langKeyByModel?: Partial<Record<WorkAreaModel, MaintenanceTaskKey>>;
  /** Applies only to these models (mutually exclusive with `excludeModels`). */
  models?: WorkAreaModel[];
}

/** A model's resolved checklist: its tasks plus the area order to render them in. */
export interface MaintenanceSchedule {
  areaOrder: MaintenanceArea[];
  tasks: MaintenanceTask[];
}
