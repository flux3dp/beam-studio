import { getStorage, setStorage } from '@core/app/stores/storageStore';

export const getFramingPower = (): number => {
  const value = getStorage('beamgo-framing-power');

  return Number.isInteger(value) && value! >= 1 && value! <= 100 ? value! : 15;
};

export const setFramingPower = (value: number): void => {
  if (!Number.isInteger(value) || value < 1 || value > 100) throw new Error('INVALID_PARAMS');

  setStorage('beamgo-framing-power', value);
};

export const getBeamGoWatt = (serial = getStorage('last-beamgo-serial') ?? ''): 10 | 20 =>
  getStorage('beamgo-watts')?.[serial] === 20 ? 20 : 10;

export const setBeamGoWatt = (serial: string, watt: 10 | 20): void => {
  setStorage('beamgo-watts', { ...getStorage('beamgo-watts'), [serial]: watt });
  setStorage('last-beamgo-serial', serial);
};
