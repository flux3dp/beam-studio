import type { AddOnInfo } from '@core/app/constants/addOn';
import { CHUCK_ROTARY_DIAMETER, RotaryType } from '@core/app/constants/addOn';
import { useDocumentStore } from '@core/app/stores/documentStore';

const getRotaryRatio = ({ rotary: rotaryInfo }: AddOnInfo): number => {
  let ratio = 1;

  const {
    'rotary-chuck-obj-d': objectDiameter,
    'rotary-mirror': rotaryMirror,
    'rotary-scale': rotaryScale,
    'rotary-type': rotaryType,
  } = useDocumentStore.getState();

  if (rotaryType === RotaryType.Chuck && rotaryInfo?.chuck) {
    ratio = (rotaryInfo.chuckDiameter ?? CHUCK_ROTARY_DIAMETER) / objectDiameter;
  }

  if (rotaryInfo?.mirror) {
    const { defaultMirror } = rotaryInfo;

    if (rotaryMirror !== Boolean(defaultMirror)) {
      ratio *= -1;
    }
  }

  if (rotaryScale > 0) {
    ratio *= rotaryScale;
  }

  return ratio;
};

export default getRotaryRatio;
