/* eslint-disable import/first */
const mockGet = jest.fn();
const mockSet = jest.fn();
jest.mock('implementations/storage', () => ({
  get: (...args) => mockGet(...args),
  set: (...args) => mockSet(...args),
}));

mockGet.mockReturnValueOnce({
  abc: '123',
});

import beamboxPreference from './beambox-preference';

jest.mock('app/actions/beambox/constant', () => ({
  diode: {
    defaultOffsetX: 10, // mm
    defaultOffsetY: 10, // mm
  },
}));

const mockEmit = jest.fn();
jest.mock('helpers/eventEmitterFactory', () => ({
  createEventEmitter: () => ({
    emit: (...args) => mockEmit(...args),
  }),
}));

test('test beambox-preference', () => {
  expect(mockGet).toHaveBeenNthCalledWith(1, 'beambox-preference');
  expect(mockSet).toHaveBeenNthCalledWith(1, 'beambox-preference', {
    should_remind_calibrate_camera: true,
    mouse_input_device: window.os === 'MacOS' ? 'TOUCHPAD' : 'MOUSE',
    model: 'fbb1b',
    show_guides: false,
    show_grids: true,
    guide_x0: 0,
    guide_y0: 0,
    engrave_dpi: 'medium',
    diode_offset_x: 10,
    diode_offset_y: 10,
    use_layer_color: true,
    'anti-aliasing': true,
    low_power: 10,
    rotary_mode: 0,
    abc: '123',
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
