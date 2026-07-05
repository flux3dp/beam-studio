import React from 'react';

import { act, fireEvent, render } from '@testing-library/react';

import type { CurveMeasurer } from '@core/interfaces/CurveMeasurer';
import type { BBox, MeasureData } from '@core/interfaces/ICurveEngraving';

const mockBrowserOpen = jest.fn();

jest.mock('@core/implementations/browser', () => ({
  __esModule: true,
  default: { open: (...args: any[]) => mockBrowserOpen(...args) },
}));

import MeasureArea from './MeasureArea';

const bbox: BBox = { height: 100, width: 100, x: 0, y: 0 };

const buildMeasurer = (): jest.Mocked<CurveMeasurer> =>
  ({
    end: jest.fn(),
    measureArea: jest.fn(),
    measurePoint: jest.fn(),
    measurePoints: jest.fn(),
    setup: jest.fn(),
    setupDevice: jest.fn(),
  }) as unknown as jest.Mocked<CurveMeasurer>;

const measuredData: MeasureData = {
  errors: [[null]],
  gap: [10, 10],
  highest: 0,
  lowest: 5,
  objectHeight: 10,
  points: [[[0, 0, 5]]],
};

describe('MeasureArea dialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -- Row 4 entry point: a successful autofocus run forwards the measured data to onFinished,
  //    which is what feeds the "preview 3D curve" state flow. --
  test('Row 4: Start Autofocus runs measureArea and forwards measured data to onFinished', async () => {
    const measurer = buildMeasurer();

    measurer.measureArea.mockResolvedValue(measuredData);

    const onFinished = jest.fn();
    const { getByText } = render(
      <MeasureArea bbox={bbox} measurer={measurer} onCancel={jest.fn()} onFinished={onFinished} />,
    );

    await act(async () => {
      fireEvent.click(getByText('Start Autofocus'));
    });

    expect(measurer.measureArea).toHaveBeenCalledTimes(1);

    const [xRange, yRange, objectHeight] = measurer.measureArea.mock.calls[0];

    expect(Array.isArray(xRange)).toBe(true);
    expect(Array.isArray(yRange)).toBe(true);
    expect(objectHeight).toBe(10); // default object height
    expect(onFinished).toHaveBeenCalledTimes(1);
    expect(onFinished).toHaveBeenCalledWith(measuredData);
  });

  // -- Row 1 (component boundary): when measurement fails (measureArea resolves null, e.g. after
  //    the base measurer already popped an error), onFinished is NOT called and the panel resets
  //    to its editable state so the user can retry. --
  test('Row 1: a failed measurement (null result) does not finish and re-enables the controls', async () => {
    const measurer = buildMeasurer();

    measurer.measureArea.mockResolvedValue(null);

    const onFinished = jest.fn();
    const { getByText } = render(
      <MeasureArea bbox={bbox} measurer={measurer} onCancel={jest.fn()} onFinished={onFinished} />,
    );

    await act(async () => {
      fireEvent.click(getByText('Start Autofocus'));
    });

    expect(measurer.measureArea).toHaveBeenCalledTimes(1);
    expect(onFinished).not.toHaveBeenCalled();
    // Controls are editable again -> the Start Autofocus button is back on screen.
    expect(getByText('Start Autofocus')).toBeInTheDocument();
  });

  test('Re-select Area triggers onCancel', () => {
    const measurer = buildMeasurer();
    const onCancel = jest.fn();
    const { getByText } = render(
      <MeasureArea bbox={bbox} measurer={measurer} onCancel={onCancel} onFinished={jest.fn()} />,
    );

    fireEvent.click(getByText('Re-select Area'));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(measurer.measureArea).not.toHaveBeenCalled();
  });
});
