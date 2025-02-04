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
    'anti-aliasing': true,
    diode_offset_x: 10,
    diode_offset_y: 10,
    engrave_dpi: 'medium',
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
