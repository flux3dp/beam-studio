import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import type { AddOnInfo } from '@core/app/constants/addOn';
import { CHUCK_ROTARY_DIAMETER, RotaryType } from '@core/app/constants/addOn';

const getRotaryRatio = (addOnInfo: AddOnInfo): number => {
  let ratio = 1;

  if (beamboxPreference.read('rotary-type') === RotaryType.Chuck && addOnInfo.rotary?.chuck) {
    const objectDiameter = beamboxPreference.read('rotary-chuck-obj-d');

    ratio = CHUCK_ROTARY_DIAMETER / objectDiameter;
  }

  if (addOnInfo.rotary?.mirror) {
    const mirror = beamboxPreference.read('rotary-mirror');
    const { defaultMirror } = addOnInfo.rotary;

    if (mirror !== Boolean(defaultMirror)) {
      ratio *= -1;
    }
  }

  if (beamboxPreference.read('rotary-scale') > 0) {
    ratio *= beamboxPreference.read('rotary-scale');
  }

  return ratio;
};

export default getRotaryRatio;
