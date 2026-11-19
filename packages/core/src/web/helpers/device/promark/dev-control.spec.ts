import { calculateGalvoScale, generateMoveTask, generatePulseTask } from './dev-control';

describe('test promark dev-control', () => {
  test('generatePulseTask', () => {
    expect(
      generatePulseTask({ frequency: 27, power: 50, pulseWidth: 350, time: 100, width: 110, x: 55, y: 20.5 }),
    ).toBe('M104\nM5\nG90\nW110\nM3S0\nQ27\nP350\nT100\nG1F240000X54.9Y20.6S0\nG1F240000X55Y20.5S0\nS500\nT0\nM2\n');
  });

  test('generatePulseTask without pulse width', () => {
    expect(generatePulseTask({ frequency: 30, power: 12.5, time: 50, width: 70, x: 0, y: 70 })).toBe(
      'M104\nM5\nG90\nW70\nM3S0\nQ30\nT50\nG1F240000X0.1Y69.9S0\nG1F240000X0Y70S0\nS125\nT0\nM2\n',
    );
  });

  test('generateMoveTask', () => {
    expect(generateMoveTask({ width: 110, x: 55, y: 20.5 })).toBe(
      'M103\nM5\nG90\nW110\nM3S0\nG1F240000X54.9Y20.6S0\nG1F240000X55Y20.5S0\nM2\n',
    );
  });

  test('calculateGalvoScale swaps the axes', () => {
    const galvo = {
      x: { bulge: 1.01, scale: 100, skew: 1, trapezoid: 1 },
      y: { bulge: 1, scale: 90, skew: 1.02, trapezoid: 1 },
    };

    // canvas X came out too large -> Y scale shrinks; canvas Y too small -> X scale grows
    expect(calculateGalvoScale(galvo, { measuredX: 112, measuredY: 108, width: 110 })).toEqual({
      x: { bulge: 1.01, scale: 101.852, skew: 1, trapezoid: 1 },
      y: { bulge: 1, scale: 88.393, skew: 1.02, trapezoid: 1 },
    });
  });

  test('calculateGalvoScale keeps the scale of an axis without a measurement', () => {
    const galvo = {
      x: { bulge: 1, scale: 100, skew: 1, trapezoid: 1 },
      y: { bulge: 1, scale: 100, skew: 1, trapezoid: 1 },
    };

    expect(calculateGalvoScale(galvo, { measuredX: 0, measuredY: 100, width: 110 })).toEqual({
      x: { bulge: 1, scale: 110, skew: 1, trapezoid: 1 },
      y: { bulge: 1, scale: 100, skew: 1, trapezoid: 1 },
    });
  });
});
