import React from 'react';

import { act, fireEvent, render } from '@testing-library/react';

import type { CurveEngraving as CurveEngravingData } from '@core/interfaces/ICurveEngraving';

// --- controller mock: the component reads .data / .displayData and calls .remeasurePoints ---
const mockRemeasurePoints = jest.fn();
const mockController: {
  data: CurveEngravingData | null;
  displayData: any;
  remeasurePoints: (indices: number[]) => Promise<CurveEngravingData | null>;
} = {
  data: null,
  displayData: null,
  remeasurePoints: (...args: any[]) => mockRemeasurePoints(...args),
};

jest.mock('@core/app/actions/canvas/curveEngravingModeController', () => mockController);

// --- heavy three.js children: replace with light stand-ins so jsdom can render ---
jest.mock('@core/app/widgets/three/Canvas', () => ({ children }: any) => (
  <div data-testid="three-canvas">{children}</div>
));

jest.mock('@react-three/drei', () => ({
  Stage: ({ children }: any) => <div data-testid="three-stage">{children}</div>,
}));

// Plane mock exposes the data it received and a clickable "sphere" per display point that
// forwards to toggleSelectedIndex — this is how we exercise point selection from the UI.
jest.mock('./Plane', () => ({ data, displayData, selectedIndices, textureSource, toggleSelectedIndex }: any) => (
  <div data-testid="plane">
    <span data-testid="plane-lowest">{String(data.lowest)}</span>
    <span data-testid="plane-points">{data.points.length}</span>
    <span data-testid="plane-display-points">{displayData.displayPoints.length}</span>
    <span data-testid="plane-texture">{String(textureSource)}</span>
    <span data-testid="plane-selected">{Array.from(selectedIndices ?? []).join(',')}</span>
    {displayData.displayPoints.map((_: unknown, i: number) => (
      <button data-testid={`sphere-${i}`} key={i} onClick={() => toggleSelectedIndex(i)} type="button">
        point-{i}
      </button>
    ))}
  </div>
));

const mockGetCanvasImage = jest.fn();

jest.mock(
  './getCanvasImage',
  () =>
    (...args: any[]) =>
      mockGetCanvasImage(...args),
);

const mockGetCameraCanvasUrl = jest.fn();

jest.mock('@core/app/actions/beambox/preview-mode-background-drawer', () => ({
  getCameraCanvasUrl: (...args: any[]) => mockGetCameraCanvasUrl(...args),
}));

jest.mock('@core/app/actions/beambox/constant', () => ({ dpmm: 10 }));

const mockBrowserOpen = jest.fn();

jest.mock('@core/implementations/browser', () => ({ open: (...args: any[]) => mockBrowserOpen(...args) }));

jest.mock('@core/helpers/is-dev', () => () => false);

// translateError is left REAL (its deps are the central i18n mock + alert-constants), so the
// error-reason surfaced to the UI is the genuine mapping, matching the sheet row intent.

import CurveEngraving from './CurveEngraving';

// A 1x3 grid; point at index 1 failed to focus (error), so its display Z is null (renders red).
const buildData = (): CurveEngravingData => ({
  bbox: { height: 30, width: 30, x: 0, y: 0 },
  errors: [[null, 'error#921', null]],
  gap: [10, 10],
  highest: 0,
  lowest: 5,
  objectHeight: 5,
  points: [
    [
      [0, 0, 5],
      [10, 0, null],
      [20, 0, 5],
    ],
  ],
});

const buildDisplayData = () => ({
  depth: 5,
  displayPoints: [
    [0, 0, 5],
    [10, 0, null],
    [20, 0, 5],
  ],
  geometry: {},
  height: 30,
  maxX: 30,
  maxY: 30,
  maxZ: 5,
  minX: 0,
  minY: 0,
  minZ: 0,
  subdividedGeometry: {},
  width: 30,
});

describe('CurveEngraving dialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockController.data = buildData();
    mockController.displayData = buildDisplayData();
    mockGetCanvasImage.mockResolvedValue(null);
    mockGetCameraCanvasUrl.mockResolvedValue(null);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // -- Row 4: after autofocus completes, re-opening the 3D preview renders the measured mesh --
  test('Row 4: renders the measured geometry in the 3D preview after the antd motion settles', async () => {
    const { getByTestId, queryByTestId } = render(<CurveEngraving onClose={jest.fn()} />);

    // Before the 500ms antd-motion timer fires, the Canvas/Plane are not mounted yet.
    expect(queryByTestId('plane')).not.toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    // Canvas + Plane now render, fed with the measured data captured from the controller.
    expect(getByTestId('three-canvas')).toBeInTheDocument();
    expect(getByTestId('plane')).toBeInTheDocument();
    expect(getByTestId('plane-lowest').textContent).toBe('5');
    expect(getByTestId('plane-points').textContent).toBe('1');
    expect(getByTestId('plane-display-points').textContent).toBe('3');
  });

  // -- Row 2: clicking a failed (red) point surfaces its translated error reason --
  test('Row 2: clicking a failed point shows the translated error reason', async () => {
    // The Modal renders in a portal, so assert against baseElement (document.body), not container.
    const { baseElement, getByTestId } = render(<CurveEngraving onClose={jest.fn()} />);

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    // No error reason is shown until a single failed point is selected.
    expect(baseElement.textContent).not.toContain('Failed to auto focus');

    // Point index 1 is the failed one (errors.flat()[1] === 'error#921').
    fireEvent.click(getByTestId('sphere-1'));

    // The real translateError maps error#921 => '#921 Failed to auto focus.'
    expect(getByTestId('plane-selected').textContent).toBe('1');
    expect(baseElement.textContent).toContain('#921 Failed to auto focus.');
  });

  test('Row 2: selecting a successful point shows no error reason', async () => {
    const { baseElement, getByTestId } = render(<CurveEngraving onClose={jest.fn()} />);

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    fireEvent.click(getByTestId('sphere-0')); // index 0 has no error

    expect(getByTestId('plane-selected').textContent).toBe('0');
    expect(baseElement.textContent).not.toContain('Failed to auto focus');
  });

  // -- Row 3: clicking a focus point then Re-measure issues remeasurePoints with those indices --
  test('Row 3: Re-measure button calls remeasurePoints with the selected indices', async () => {
    mockRemeasurePoints.mockResolvedValue(buildData());

    const { getByTestId, getByText } = render(<CurveEngraving onClose={jest.fn()} />);

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    // Select two points (Set keeps click order 2,0) then trigger re-measurement.
    fireEvent.click(getByTestId('sphere-2'));
    fireEvent.click(getByTestId('sphere-0'));

    expect(getByTestId('plane-selected').textContent).toBe('2,0');

    await act(async () => {
      fireEvent.click(getByText('Re-measure'));
    });

    expect(mockRemeasurePoints).toHaveBeenCalledTimes(1);
    // handleRemeasure sorts indices ascending before dispatching.
    expect(mockRemeasurePoints).toHaveBeenCalledWith([0, 2]);
  });

  test('Row 3: Re-measure button is disabled when no point is selected', async () => {
    const { getByText } = render(<CurveEngraving onClose={jest.fn()} />);

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(getByText('Re-measure').closest('button')).toBeDisabled();
  });
});
