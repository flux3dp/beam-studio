const mockRead = jest.fn();
const mockWrite = jest.fn();

jest.mock('helpers/api/config', () => () => ({
  read: mockRead,
  write: mockWrite,
}));

test('test beambox-preference', () => {
  mockRead.mockReturnValue({
    abc: '123',
  });

  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  const beamboxPreference = require('./beambox-preference');
  expect(mockRead).toHaveBeenNthCalledWith(1, 'beambox-preference');
  expect(mockWrite).toHaveBeenNthCalledWith(1, 'beambox-preference', {
    should_remind_calibrate_camera: true,
    mouse_input_device: (process.platform === 'darwin') ? 'TOUCHPAD' : 'MOUSE',
    model: 'fbb1b',
    show_guides: false,
    guide_x0: 0,
    guide_y0: 0,
    engrave_dpi: 'medium',
    abc: '123',
  });

  mockRead.mockReturnValue({
    mouse_input_device: 'TOUCHPAD',
  });
  expect(beamboxPreference.default.read('mouse_input_device')).toBe('TOUCHPAD');
  expect(mockRead).toHaveBeenNthCalledWith(2, 'beambox-preference');

  mockRead.mockReturnValue({});
  beamboxPreference.default.write('mouse_input_device', 'MOUSE');
  expect(mockRead).toHaveBeenNthCalledWith(3, 'beambox-preference');
  expect(mockWrite).toHaveBeenNthCalledWith(2, 'beambox-preference', {
    mouse_input_device: 'MOUSE',
  });
});
