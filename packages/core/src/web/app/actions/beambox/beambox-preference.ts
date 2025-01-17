import constant from 'app/actions/beambox/constant';
import eventEmitterFactory from 'helpers/eventEmitterFactory';
import storage from 'implementations/storage';

const DEFAULT_PREFERENCE = {
  should_remind_calibrate_camera: true,
  mouse_input_device: window.os === 'MacOS' ? 'TOUCHPAD' : 'MOUSE',
  model: 'fbb1b',
  show_guides: false,
  show_grids: true,
  use_layer_color: true,
  'anti-aliasing': true,
  guide_x0: 0,
  guide_y0: 0,
  engrave_dpi: 'medium', // low, medium, high
  diode_offset_x: constant.diode.defaultOffsetX,
  diode_offset_y: constant.diode.defaultOffsetY,
  low_power: 10,
  rotary_mode: 0,
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

  // eslint-disable-next-line class-methods-use-this
  read(key) {
    return storage.get('beambox-preference')[key];
  }

  // eslint-disable-next-line class-methods-use-this
  write(key, value) {
    const pref = storage.get('beambox-preference');
    pref[key] = value;
    storage.set('beambox-preference', pref);
    eventEmitter.emit(key, value);
  }
}

const beamboxPreference = new BeamboxPreference();

export const migrate = (): void => {
  const rotaryMode = beamboxPreference.read('rotary_mode');
  if (typeof rotaryMode === 'boolean') beamboxPreference.write('rotary_mode', rotaryMode ? 1 : 0);
  if (beamboxPreference.read('model') === 'fad1') beamboxPreference.write('model', 'ado1');
  if (beamboxPreference.read('workarea') === 'fad1') beamboxPreference.write('workarea', 'ado1');
};

export default beamboxPreference;
