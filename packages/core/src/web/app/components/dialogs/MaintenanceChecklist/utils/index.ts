import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';

export { formatShortDate } from './formatShortDate';

/** A machine the checklist can be shown for: a connected device, a previously-seen one, or a bare model. */
export interface Selection {
  key: string;
  model: WorkAreaModel;
  nickname?: string;
}

/** Human-readable model name, e.g. 'Beambox II'. */
export const modelLabel = (model: WorkAreaModel): string => getWorkarea(model).label;
