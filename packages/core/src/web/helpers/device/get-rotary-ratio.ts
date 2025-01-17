import beamboxPreference from 'app/actions/beambox/beambox-preference';
import { CHUCK_ROTARY_DIAMETER, RotaryType, SupportInfo } from 'app/constants/add-on';

const getRotaryRatio = (supportInfo: SupportInfo): number => {
  let ratio = 1;
  if (beamboxPreference.read('rotary-type') === RotaryType.Chuck && supportInfo.rotary?.chuck) {
    const objectDiameter = beamboxPreference.read('rotary-chuck-obj-d') || CHUCK_ROTARY_DIAMETER;
    ratio = CHUCK_ROTARY_DIAMETER / objectDiameter;
  }
  if (supportInfo.rotary?.mirror) {
    const mirror = !!beamboxPreference.read('rotary-mirror');
    const { defaultMirror } = supportInfo.rotary;
    if (mirror !== Boolean(defaultMirror)) ratio *= -1;
  }
  return ratio;
};

export default getRotaryRatio;
