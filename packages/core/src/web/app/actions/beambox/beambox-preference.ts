import constant from '@core/app/actions/beambox/constant';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

import storage from '@app/implementations/storage';

const DEFAULT_PREFERENCE = {
  'anti-aliasing': true,
  diode_offset_x: constant.diode.defaultOffsetX,
  diode_offset_y: constant.diode.defaultOffsetY,
  engrave_dpi: 'medium', // low, medium, high
  guide_x0: 0,
  guide_y0: 0,
  low_power: 10,
  model: 'fbb1b',
  mouse_input_device: window.os === 'MacOS' ? 'TOUCHPAD' : 'MOUSE',
  rotary_mode: 0,
  should_remind_calibrate_camera: true,
  show_grids: true,
  show_guides: false,
  use_layer_color: true,
};

const eventEmitter = eventEmitterFactory.createEventEmitter('beambox-preference');

class BeamboxPreference {
  constructor() {
    // set default preference if key or even beambox-preference doesn't exist
    let pref: any = storage.get('beambox-preference');

    pref = pref === '' ? {} : pref;
    console.log(pref);

    const fullPref = Object.assign(DEFAULT_PREFERENCE, pref);

    storage.set('beambox-preference', fullPref);
  }

  read(key: string) {
    return storage.get('beambox-preference')[key];
  }

  write(key: string, value: any) {
    const pref = storage.get('beambox-preference');

    pref[key] = value;
    storage.set('beambox-preference', pref);
    eventEmitter.emit(key, value);
  }
}

const beamboxPreference = new BeamboxPreference();

export const migrate = (): void => {
  const rotaryMode = beamboxPreference.read('rotary_mode');

  if (typeof rotaryMode === 'boolean') {
    beamboxPreference.write('rotary_mode', rotaryMode ? 1 : 0);
  }

  if (beamboxPreference.read('model') === 'fad1') {
    beamboxPreference.write('model', 'ado1');
  }

  if (beamboxPreference.read('workarea') === 'fad1') {
    beamboxPreference.write('workarea', 'ado1');
  }
};

export default beamboxPreference;
