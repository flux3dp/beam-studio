import { promarkModels } from 'app/actions/beambox/constant';
import { WorkAreaModel } from 'app/constants/workarea-constants';

export interface TextSetting {
  select: { value: string; label: string };
  power: number;
  speed: number;
}

export const textParams = ['power', 'speed'] as const;

export const getTextSetting = (workarea: WorkAreaModel): TextSetting => ({
  select: { value: 'custom', label: 'Custom' },
  power: 15,
  speed: promarkModels.has(workarea) ? 1000 : 20,
});
