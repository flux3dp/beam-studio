import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import i18n from '@core/helpers/i18n';

import { ALL_SCHEDULED_MODELS, buildHelpUrl, getMaintenanceArticleId } from './meta';
import { maintenanceTasks } from './tasks';
import type { MaintenanceSchedule, MaintenanceTask, MaintenanceTaskDef } from './types';
import { GLOBAL_AREA_ORDER } from './types';

export * from './types';

/** Whether a catalog entry applies to a given model. */
const appliesTo = (def: MaintenanceTaskDef, model: WorkAreaModel): boolean =>
  def.models ? def.models.includes(model) : ALL_SCHEDULED_MODELS.includes(model) && !def.excludeModels?.includes(model);

// Keyed by `model|lang` so a language switch yields freshly localized Help Center URLs.
const scheduleCache = new Map<string, MaintenanceSchedule | undefined>();

const buildSchedule = (model: WorkAreaModel): MaintenanceSchedule | undefined => {
  const defaultArticleId = getMaintenanceArticleId(model);

  // A model with no Help Center article has no schedule.
  if (!defaultArticleId) return undefined;

  const tasks: MaintenanceTask[] = maintenanceTasks
    .filter((def) => appliesTo(def, model))
    .map((def) => ({
      actionType: def.actionType,
      area: def.area,
      cadence: def.cadence,
      essential: def.essential,
      helpUrl: buildHelpUrl(def.helpArticleIds?.[model] ?? defaultArticleId),
      id: def.id,
      langKey: def.langKeyByModel?.[model] ?? def.langKey,
    }));

  const areaOrder = GLOBAL_AREA_ORDER.filter((area) => tasks.some((task) => task.area === area));

  return { areaOrder, tasks };
};

/** Returns the maintenance schedule for a model, or undefined when none is defined. */
export const getScheduleForModel = (model: WorkAreaModel): MaintenanceSchedule | undefined => {
  const cacheKey = `${model}|${i18n.getActiveLang()}`;

  if (!scheduleCache.has(cacheKey)) {
    scheduleCache.set(cacheKey, buildSchedule(model));
  }

  return scheduleCache.get(cacheKey);
};

/** Models that currently have a maintenance schedule (for read/plan mode selection). */
export const modelsWithSchedule = ALL_SCHEDULED_MODELS;
