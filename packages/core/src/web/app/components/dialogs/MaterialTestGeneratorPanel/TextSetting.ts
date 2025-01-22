import { promarkModels } from '@core/app/actions/beambox/constant';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';

export interface TextSetting {
  power: number;
  select: { label: string; value: string };
  speed: number;
}

export const textParams = ['power', 'speed'] as const;

export const getTextSetting = (workarea: WorkAreaModel): TextSetting => ({
  power: 15,
  select: { label: 'Custom', value: 'custom' },
  speed: promarkModels.has(workarea) ? 1000 : 20,
});
