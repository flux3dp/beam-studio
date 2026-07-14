import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { setCameraPreviewState, useCameraPreviewStore } from '@core/app/stores/cameraPreview';

import OpacitySlider from './OpacitySlider';

// The antd Slider's onChange fires from pointer/keyboard math that jsdom (no layout) can't
// drive, so we expose the wired-up onChange/value directly and assert the store side effects
// against the real, exact step values (0 / 0.25 / 0.5 / 0.75 / 1) the source declares.
let capturedProps: any;

jest.mock('antd', () => ({
  Slider: (props: any) => {
    capturedProps = props;

    return (
      <input
        aria-label="opacity-slider"
        data-testid="slider"
        max={props.max}
        min={props.min}
        onChange={(e) => props.onChange(Number(e.target.value))}
        step={props.step}
        type="range"
        value={props.value}
      />
    );
  },
}));

describe('OpacitySlider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedProps = undefined;
  });

  it('should configure the slider for the five fixed 25% steps (0..1, step 0.25)', () => {
    render(<OpacitySlider />);

    expect(capturedProps.min).toBe(0);
    expect(capturedProps.max).toBe(1);
    expect(capturedProps.step).toBe(0.25);

    // 0..1 by 0.25 => exactly five stops
    const stops: number[] = [];

    for (let v = capturedProps.min; v <= capturedProps.max + 1e-9; v += capturedProps.step) {
      stops.push(Number(v.toFixed(2)));
    }

    expect(stops).toEqual([0, 0.25, 0.5, 0.75, 1]);
  });

  it('should reflect the store default (bgOpacity 1) as value 1 and "100%"', () => {
    const { getByTestId } = render(<OpacitySlider />);

    expect(capturedProps.value).toBe(1);
    expect(getByTestId('slider')).toHaveValue('1');
  });

  it.each([
    [0, '0%'],
    [0.25, '25%'],
    [0.5, '50%'],
    [0.75, '75%'],
    [1, '100%'],
  ])('should display bgOpacity %p as "%s"', (bgOpacity, label) => {
    setCameraPreviewState({ bgOpacity });

    const { container } = render(<OpacitySlider />);

    expect(container.textContent).toContain(label);
    expect(capturedProps.value).toBe(bgOpacity);
  });

  it.each([[0], [0.25], [0.5], [0.75], [1]])(
    'should set the store bgOpacity to the exact value %p on change',
    (val) => {
      const { getByTestId } = render(<OpacitySlider />);

      fireEvent.change(getByTestId('slider'), { target: { value: String(val) } });

      expect(useCameraPreviewStore.getState().bgOpacity).toBe(val);
    },
  );

  it('should sync the #previewSvg element opacity to the chosen value', () => {
    const previewSvg = document.createElement('div');

    previewSvg.id = 'previewSvg';
    document.body.appendChild(previewSvg);

    try {
      const { getByTestId } = render(<OpacitySlider />);

      fireEvent.change(getByTestId('slider'), { target: { value: '0.5' } });

      expect(previewSvg.style.opacity).toBe('0.5');
    } finally {
      previewSvg.remove();
    }
  });

  it('should not throw when #previewSvg is absent while still updating the store', () => {
    expect(document.querySelector('#previewSvg')).toBeNull();

    const { getByTestId } = render(<OpacitySlider />);

    expect(() => fireEvent.change(getByTestId('slider'), { target: { value: '0.75' } })).not.toThrow();
    expect(useCameraPreviewStore.getState().bgOpacity).toBe(0.75);
  });

  it('should keep the displayed percentage in sync after a store change', () => {
    const { container } = render(<OpacitySlider />);

    expect(container.textContent).toContain('100%');

    fireEvent.change(container.querySelector('[data-testid="slider"]')!, { target: { value: '0.25' } });

    expect(container.textContent).toContain('25%');
  });
});
