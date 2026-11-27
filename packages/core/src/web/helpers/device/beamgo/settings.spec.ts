import { getStorage, setStorage } from '@core/app/stores/storageStore';

import { getBeamGoWatt, getFramingPower, setBeamGoWatt, setFramingPower } from './settings';

describe('BeamGo preferences', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setStorage('beamgo-framing-power', undefined);
    setStorage('beamgo-watts', {});
    setStorage('last-beamgo-serial', undefined);
  });

  test('defaults to 15% and rejects invalid values without saving', () => {
    expect(getFramingPower()).toBe(15);
    setFramingPower(30);
    expect(getFramingPower()).toBe(30);
    [0, 101, 1.5, Number.NaN].forEach((value) => expect(() => setFramingPower(value)).toThrow('INVALID_PARAMS'));
    expect(getStorage('beamgo-framing-power')).toBe(30);
  });

  test('keeps wattage per serial and uses 10 W for an unknown machine', () => {
    expect(getBeamGoWatt('new')).toBe(10);
    setBeamGoWatt('A', 20);
    setBeamGoWatt('B', 10);
    expect(getBeamGoWatt('A')).toBe(20);
    expect(getBeamGoWatt()).toBe(10);
  });
});
