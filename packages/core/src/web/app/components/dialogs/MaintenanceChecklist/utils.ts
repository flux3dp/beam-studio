import type { MaintenanceTask } from '@core/app/constants/maintenance';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import type { ILang } from '@core/interfaces/ILang';

type MaintenanceLang = ILang['maintenance'];

/** A machine the checklist can be shown for: a connected device, a previously-seen one, or a bare model. */
export interface Selection {
  key: string;
  model: WorkAreaModel;
  nickname?: string;
}

/** Human-readable model name, e.g. 'Beambox II'. */
export const modelLabel = (model: WorkAreaModel): string => getWorkarea(model).label;

/** Resolves a task's localized name + key points from its flat i18n key. */
export const getTaskStrings = (tMaint: MaintenanceLang, task: MaintenanceTask): { keyPoints: string; name: string } =>
  tMaint.tasks[task.langKey];
