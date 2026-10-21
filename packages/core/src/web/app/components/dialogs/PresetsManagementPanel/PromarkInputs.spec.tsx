import React, { act } from 'react';

import { fireEvent, render } from '@testing-library/react';

import { UV_POWER_LIMIT, uvFrequencyToPower, uvPowerToFrequency } from '@core/helpers/layer/uvPowerFrequency';

import PromarkInputs from './PromarkInputs';

const handleChange = jest.fn();
const preset = {
  biDirectional: true,
  crossHatch: false,
  dottingTime: 100,
  fillAngle: 0,
  fillInterval: 0.1,
  focus: 0,
  focusStep: 1,
  frequency: 30,
  isDefault: false,
  power: 100,
  pulseWidth: 100,
  repeat: 1,
  speed: 100,
  wobbleDiameter: 0.2,
  wobbleStep: 0.01,
};
const maxSpeed = 100;
const minSpeed = 0.1;

const inputTests = [
  { key: 'power', value: 10 },
  { key: 'speed', value: 10 },
  { key: 'repeat', value: 10 },
  { key: 'focus', value: 10 },
  { key: 'focusStep', value: 0.1 },
  { key: 'pulseWidth', value: 110 },
  { key: 'frequency', value: 32 },
  { key: 'fillInterval', value: 0.2 },
  { key: 'fillAngle', value: 10 },
  { key: 'dottingTime', value: 150 },
  { key: 'wobbleStep', value: 0.1 },
  { key: 'wobbleDiameter', value: 2 },
];

const switchTests = [
  { key: 'biDirectional', value: false },
  { key: 'crossHatch', value: true },
];

const mockIsPromarkUV = jest.fn();
const mockGetPromarkLimit = jest.fn();

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  getDefaultConfig: () => ({}),
  getPromarkLimit: () => mockGetPromarkLimit(),
  isPromarkUV: () => mockIsPromarkUV(),
}));

const mockIsInnerEngravingActive = jest.fn();

jest.mock('@core/helpers/addOn/innerEngraving', () => ({
  isInnerEngravingActive: () => mockIsInnerEngravingActive(),
}));

const renderInputs = (overrides: Partial<typeof preset> & Record<string, unknown> = {}) =>
  render(
    <PromarkInputs
      handleChange={handleChange}
      maxSpeed={maxSpeed}
      minSpeed={minSpeed}
      preset={{ ...preset, ...overrides }}
    />,
  );

describe('PromarkInputs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsPromarkUV.mockReturnValue(false);
    mockIsInnerEngravingActive.mockReturnValue(false);
    mockGetPromarkLimit.mockReturnValue({
      frequency: { max: 4000, min: 1 },
      pulseWidth: { max: 350, min: 2 },
    });
  });

  it('should render correctly', () => {
    const { container } = renderInputs();

    expect(container).toMatchSnapshot();
  });

  it.each(inputTests)('should call handleChange when $key value changes', ({ key, value }) => {
    const { getByTestId } = renderInputs();
    const input = getByTestId(key);

    fireEvent.change(input, { target: { value } });
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenLastCalledWith(key, value);
  });

  it.each(switchTests)('should call handleChange when $key value changes', ({ key, value }) => {
    const { getByTestId } = renderInputs();
    const input = getByTestId(key);

    fireEvent.click(input);
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenLastCalledWith(key, value);
  });

  describe('UV source', () => {
    beforeEach(() => {
      mockIsPromarkUV.mockReturnValue(true);
      mockGetPromarkLimit.mockReturnValue({
        frequency: { max: 200, min: 30 },
        power: { ...UV_POWER_LIMIT },
        qPulseWidth: { max: 1365, min: 0.021 },
      });
    });

    test('shows the power the frequency stands for, within the UV range', () => {
      const { getByTestId, queryByTestId } = renderInputs({ frequency: 170, power: undefined });
      const power = getByTestId('power');

      expect(power).toHaveAttribute('value', String(Math.round(uvFrequencyToPower(170) * 10) / 10));
      expect(power).toHaveAttribute('min', String(UV_POWER_LIMIT.min));
      expect(power).toHaveAttribute('max', '100');
      expect(getByTestId('frequency')).toHaveAttribute('value', '170');
      // the pulse width is fixed on UV
      expect(queryByTestId('pulseWidth')).toBeNull();
    });

    test('shows the frequency a power-only preset stands for', () => {
      const { getByTestId } = renderInputs({ frequency: undefined, power: 50 });

      expect(getByTestId('frequency')).toHaveAttribute('value', String(uvPowerToFrequency(50)));
    });

    test('writes the frequency along with the power', () => {
      const { getByTestId } = renderInputs();

      fireEvent.change(getByTestId('power'), { target: { value: 50 } });
      expect(handleChange).toHaveBeenCalledTimes(2);
      expect(handleChange).toHaveBeenNthCalledWith(1, 'power', 50);
      expect(handleChange).toHaveBeenNthCalledWith(2, 'frequency', uvPowerToFrequency(50));
    });

    test('writes the power along with the frequency', () => {
      const { getByTestId } = renderInputs();

      fireEvent.change(getByTestId('frequency'), { target: { value: 120 } });
      expect(handleChange).toHaveBeenCalledTimes(2);
      expect(handleChange).toHaveBeenNthCalledWith(1, 'frequency', 120);
      expect(handleChange).toHaveBeenNthCalledWith(2, 'power', uvFrequencyToPower(120));
    });
  });

  describe('inner engraving', () => {
    beforeEach(() => {
      mockIsPromarkUV.mockReturnValue(true);
      mockIsInnerEngravingActive.mockReturnValue(true);
      mockGetPromarkLimit.mockReturnValue({
        frequency: { max: 200, min: 30 },
        power: { ...UV_POWER_LIMIT },
      });
    });

    test('dot mode shows the dot parameters and neither speed, passes nor fill settings', () => {
      const { container, getByTestId, queryByTestId } = renderInputs({
        stlMode: 'dot',
        stlPointSpacing: 0.03,
        stlSolid: false,
      });

      expect(container).toMatchSnapshot();
      expect(getByTestId('dottingTime')).toBeInTheDocument();
      expect(getByTestId('stlPointSpacing')).toHaveAttribute('value', '0.03');
      expect(getByTestId('stlSolid')).toBeInTheDocument();
      expect(queryByTestId('stlLayerSpacing')).toBeNull();
      expect(queryByTestId('speed')).toBeNull();
      expect(queryByTestId('repeat')).toBeNull();
      expect(queryByTestId('fillInterval')).toBeNull();
      expect(queryByTestId('wobbleStep')).toBeNull();

      fireEvent.change(getByTestId('stlPointSpacing'), { target: { value: 0.05 } });
      expect(handleChange).toHaveBeenLastCalledWith('stlPointSpacing', 0.05);

      fireEvent.click(getByTestId('stlSolid'));
      expect(handleChange).toHaveBeenLastCalledWith('stlSolid', true);
    });

    test('thick contour dotting adds the layer spacing', () => {
      const { getByTestId } = renderInputs({ stlLayerSpacing: 0.04, stlMode: 'dot', stlSolid: true });

      expect(getByTestId('stlLayerSpacing')).toHaveAttribute('value', '0.04');
    });

    test('line mode shows the speed and the layer spacings, and no dot parameters', () => {
      const { getByTestId, queryByTestId } = renderInputs({
        stlLayerSpacing: 0.04,
        stlMinLayerSpacing: 0,
        stlMode: 'line',
      });

      expect(getByTestId('speed')).toBeInTheDocument();
      expect(getByTestId('stlLayerSpacing')).toHaveAttribute('value', '0.04');
      expect(getByTestId('stlMinLayerSpacing')).toHaveAttribute('value', '0');
      expect(queryByTestId('dottingTime')).toBeNull();
      expect(queryByTestId('stlPointSpacing')).toBeNull();
      expect(queryByTestId('stlSolid')).toBeNull();

      fireEvent.change(getByTestId('stlMinLayerSpacing'), { target: { value: 0.02 } });
      expect(handleChange).toHaveBeenLastCalledWith('stlMinLayerSpacing', 0.02);
    });

    test('changes the mode', () => {
      const { baseElement } = renderInputs({ stlMode: 'dot' });

      act(() => fireEvent.mouseDown(baseElement.querySelector('#stlMode')!));
      fireEvent.click(baseElement.querySelector('.rc-virtual-list [title="Line"]')!);
      expect(handleChange).toHaveBeenLastCalledWith('stlMode', 'line');
    });
  });
});
