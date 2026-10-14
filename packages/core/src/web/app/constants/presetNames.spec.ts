import { presetNames } from './presetNames';
import presets from './presets';

test('every preset key has display-name parts', () => {
  const missing = Object.keys(presets).filter((key) => !presetNames[key]);

  expect(missing).toEqual([]);
});
