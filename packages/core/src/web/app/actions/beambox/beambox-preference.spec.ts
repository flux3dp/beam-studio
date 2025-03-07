const mockGet = jest.fn();
const mockSet = jest.fn();

jest.mock('@core/implementations/storage', () => ({
  get: (...args) => mockGet(...args),
  set: (...args) => mockSet(...args),
}));

mockGet.mockReturnValueOnce({
  abc: '123',
});

import beamboxPreference from './beambox-preference';

jest.mock('@core/app/actions/beambox/constant', () => ({
  diode: {
    defaultOffsetX: 10, // mm
    defaultOffsetY: 10, // mm
  },
}));

jest.mock('@core/app/actions/beambox/constant', () => ({
  diode: {
    calibrationPicture: {
      centerX: 159, // mm
      centerY: 96, // mm
      offsetX: 69, // mm
      offsetY: 6, // mm
    },
    defaultOffsetX: 70, // mm
    defaultOffsetY: 7, // mm
    limitX: 50, // mm
    limitY: 10, // mm
    safeDistance: {
      X: 50, // mm
      Y: 15, // mm
    },
  },
  PreviewSpeedLevel: {
    FAST: 2,
    MEDIUM: 1,
    SLOW: 0,
  },
}));

const mockEmit = jest.fn();

jest.mock('@core/helpers/eventEmitterFactory', () => ({
  createEventEmitter: () => ({
    emit: (...args) => mockEmit(...args),
  }),
}));

test('test beambox-preference', () => {
  expect(mockGet).toHaveBeenNthCalledWith(1, 'beambox-preference');
  expect(mockSet).toHaveBeenNthCalledWith(1, 'beambox-preference', {
    abc: '123',
    'af-offset': 0,
    'anti-aliasing': true,
    'auto-feeder': false,
    'auto-switch-tab': false,
    auto_align: true,
    blade_precut: false,
    blade_radius: 0,
    borderless: false,
    continuous_drawing: false,
    curve_engraving_speed_limit: true,
    'customized-dimension': { fpm1: { height: 150, width: 150 } },
    'default-autofocus': false,
    'default-borderless': false,
    'default-diode': false,
    'default-laser-module': 2,
    'diode-one-way-engraving': true,
    diode_offset_x: 70,
    diode_offset_y: 7,
    'enable-custom-backlash': false,
    'enable-custom-preview-height': false,
    'enable-job-origin': false,
    enable_mask: false,
    engrave_dpi: 'medium',
    'extend-rotary-workarea': false,
    fast_gradient: true,
    'font-convert': '2.0',
    'font-substitute': true,
    'frame-before-start': false,
    guide_x0: 0,
    guide_y0: 0,
    image_downsampling: true,
    'job-origin': 1,
    'keep-preview-result': false,
    low_power: 10,
    model: 'fbb1b',
    'module-offsets': {
      '1': [0, 0],
      '2': [0, 0],
      '4': [0, 26.95],
      '5': [0, -13.37],
      '15': [0, 0],
    },
    mouse_input_device: window.os === 'MacOS' ? 'TOUCHPAD' : 'MOUSE',
    'multipass-compensation': true,
    'one-way-printing': true,
    padding_accel: 5000,
    padding_accel_diode: 4500,
    'pass-through': false,
    'path-engine': 'fluxghost',
    precut_x: 0,
    precut_y: 0,
    preview_movement_speed_level: 0,
    'print-advanced-mode': false,
    'promark-start-button': false,
    'reverse-engraving': false,
    'rotary-chuck-obj-d': 133,
    'rotary-mirror': false,
    'rotary-type': 1,
    'rotary-y': null,
    rotary_mode: false,
    rotary_y_coord: 5,
    should_remind_calibrate_camera: true,
    show_grids: true,
    show_guides: true,
    show_rulers: false,
    simplify_clipper_path: false,
    use_layer_color: true,
    vector_speed_constraint: true,
    workarea: 'fbb1b',
    zoom_with_window: false,
  });

  mockGet.mockReturnValue({
    mouse_input_device: 'TOUCHPAD',
  });
  expect(beamboxPreference.read('mouse_input_device')).toBe('TOUCHPAD');
  expect(mockGet).toHaveBeenNthCalledWith(2, 'beambox-preference');

  mockGet.mockReturnValue({});
  expect(mockEmit).not.toHaveBeenCalled();
  beamboxPreference.write('mouse_input_device', 'MOUSE');
  expect(mockGet).toHaveBeenNthCalledWith(3, 'beambox-preference');
  expect(mockSet).toHaveBeenNthCalledWith(2, 'beambox-preference', {
    mouse_input_device: 'MOUSE',
  });
  expect(mockEmit).toHaveBeenNthCalledWith(1, 'mouse_input_device', 'MOUSE');
});
