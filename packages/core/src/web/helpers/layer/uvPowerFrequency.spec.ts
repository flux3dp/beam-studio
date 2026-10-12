import { UV_FREQUENCY_LIMIT, UV_POWER_LIMIT, uvFrequencyToPower, uvPowerToFrequency } from './uvPowerFrequency';

// frequency (kHz) and measured output (W), 4.5W = 100%
const measured: Array<[number, number]> = [
  [40, 4.5],
  [50, 4],
  [60, 3.6],
  [80, 2.8],
  [100, 2.2],
  [120, 1.8],
  [150, 1.3],
  [180, 0.9],
  [200, 0.7],
];

describe('test uvPowerFrequency', () => {
  test('limits', () => {
    expect(UV_FREQUENCY_LIMIT).toEqual({ max: 200, min: 30 });
    expect(UV_POWER_LIMIT.max).toBe(100);
    expect(UV_POWER_LIMIT.min).toBeCloseTo((0.7 / 4.5) * 100);
  });

  test.each(measured)('%ikHz maps to its measured output both ways', (frequency, watt) => {
    const power = (watt / 4.5) * 100;

    expect(uvFrequencyToPower(frequency)).toBeCloseTo(power);
    expect(uvPowerToFrequency(power)).toBeCloseTo(frequency);
  });

  test('interpolates linearly between the measured points', () => {
    // halfway between 80kHz (62.2%) and 100kHz (48.9%)
    expect(uvFrequencyToPower(90)).toBeCloseTo(((2.8 + 2.2) / 2 / 4.5) * 100);
    // 50% sits between 80kHz and 100kHz
    expect(uvPowerToFrequency(50)).toBeCloseTo(98.333, 3);
    // 40% is exactly 120kHz
    expect(uvPowerToFrequency(40)).toBeCloseTo(120);
  });

  test('frequencies at or below 40kHz read as 100%', () => {
    expect(uvFrequencyToPower(30)).toBe(100);
    expect(uvFrequencyToPower(35)).toBe(100);
    expect(uvPowerToFrequency(100)).toBe(40);
  });

  test('clamps outside the measured range', () => {
    expect(uvPowerToFrequency(120)).toBe(40);
    expect(uvPowerToFrequency(5)).toBe(200);
    expect(uvFrequencyToPower(250)).toBeCloseTo(UV_POWER_LIMIT.min);
  });

  test('power decreases as the frequency rises and round-trips', () => {
    let last = Infinity;

    for (let frequency = 40; frequency <= 200; frequency += 0.5) {
      const power = uvFrequencyToPower(frequency);

      expect(power).toBeLessThan(last);
      expect(uvPowerToFrequency(power)).toBeCloseTo(frequency, 6);
      last = power;
    }
  });
});
