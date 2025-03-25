import React, { act } from 'react';

import { fireEvent, render } from '@testing-library/react';

import { RotaryType } from '@core/app/constants/addOn';

import RotarySettings from './RotarySettings';

const mockRead = jest.fn();
const mockWrite = jest.fn();

jest.mock('@core/app/actions/beambox/beambox-preference', () => ({
  read: (...args) => mockRead(...args),
  write: (...args) => mockWrite(...args),
}));

const mockChangeWorkarea = jest.fn();

jest.mock(
  '@core/app/svgedit/operations/changeWorkarea',
  () =>
    (...args) =>
      mockChangeWorkarea(...args),
);

const mockToggleDisplay = jest.fn();

jest.mock('@core/app/actions/canvas/rotary-axis', () => ({
  toggleDisplay: (...args) => mockToggleDisplay(...args),
}));

const mockStorageGet = jest.fn();

jest.mock('@core/implementations/storage', () => ({
  get: (...args) => mockStorageGet(...args),
}));

const mockAddDialogComponent = jest.fn();
const mockIsIdExist = jest.fn();
const mockPopDialogById = jest.fn();

jest.mock('@core/app/actions/dialog-controller', () => ({
  addDialogComponent: (...args) => mockAddDialogComponent(...args),
  isIdExist: (...args) => mockIsIdExist(...args),
  popDialogById: (...args) => mockPopDialogById(...args),
}));

const mockOnClose = jest.fn();

describe('test RotarySettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRead.mockImplementation((key) => (key === 'workarea' ? 'ado1' : undefined));
  });

  it('should render correctly', () => {
    const { baseElement } = render(<RotarySettings onClose={mockOnClose} />);

    expect(baseElement).toMatchSnapshot();
  });

  test('disabled and enabled fields', () => {
    const { baseElement, getByText } = render(<RotarySettings onClose={mockOnClose} />);
    const segControl = baseElement.querySelector('#rotary_type');
    const chuckDiameter = baseElement.querySelector('#object_diameter');
    const circumference = baseElement.querySelector('#circumference');
    const mirrorCheckbox = baseElement.querySelector('#mirror');
    const extendCheckbox = baseElement.querySelector('#extend');
    const scaleSelect = baseElement.querySelector('#scale');

    expect(segControl).toHaveClass('ant-segmented-disabled');
    expect(chuckDiameter).toHaveAttribute('disabled');
    expect(circumference).toHaveAttribute('disabled');
    expect(mirrorCheckbox.parentNode).toHaveClass('ant-checkbox-disabled');
    expect(extendCheckbox.parentNode).toHaveClass('ant-checkbox-disabled');
    expect(scaleSelect).toHaveAttribute('disabled');

    const rotaryMode = baseElement.querySelector('#rotary_mode');

    fireEvent.click(rotaryMode);
    expect(segControl).not.toHaveClass('ant-segmented-disabled');
    expect(chuckDiameter).toHaveAttribute('disabled');
    expect(circumference).toHaveAttribute('disabled');
    expect(mirrorCheckbox.parentNode).not.toHaveClass('ant-checkbox-disabled');
    expect(extendCheckbox.parentNode).not.toHaveClass('ant-checkbox-disabled');
    expect(scaleSelect).not.toHaveAttribute('disabled');

    const chuckSegmentSelector = getByText('Chuck');

    fireEvent.click(chuckSegmentSelector);
    expect(chuckDiameter).not.toHaveAttribute('disabled');
    expect(circumference).not.toHaveAttribute('disabled');
  });

  test('save settings', () => {
    const { baseElement, getByText } = render(<RotarySettings onClose={mockOnClose} />);
    const rotaryMode = baseElement.querySelector('#rotary_mode');
    const chuckSegmentSelector = getByText('Chuck');
    const chuckDiameter = baseElement.querySelector('#object_diameter');
    const extendCheckbox = baseElement.querySelector('#extend');
    const scaleSelect = baseElement.querySelector('#scale');

    fireEvent.click(rotaryMode);
    fireEvent.click(chuckSegmentSelector);
    fireEvent.change(chuckDiameter, { target: { value: 10 } });
    fireEvent.click(extendCheckbox);
    act(() => fireEvent.mouseDown(scaleSelect));
    fireEvent.click(baseElement.querySelector('.rc-virtual-list [title="2"]'));

    const saveButton = baseElement.querySelector('.ant-btn-primary');

    fireEvent.click(saveButton);
    expect(mockWrite).toHaveBeenCalledTimes(6);
    expect(mockWrite).toHaveBeenNthCalledWith(1, 'rotary_mode', true);
    expect(mockWrite).toHaveBeenNthCalledWith(2, 'rotary-type', RotaryType.Chuck);
    expect(mockWrite).toHaveBeenNthCalledWith(3, 'rotary-scale', 2);
    expect(mockWrite).toHaveBeenNthCalledWith(4, 'rotary-chuck-obj-d', 10);
    expect(mockWrite).toHaveBeenNthCalledWith(5, 'rotary-mirror', false);
    expect(mockWrite).toHaveBeenNthCalledWith(6, 'extend-rotary-workarea', true);
    expect(mockChangeWorkarea).toHaveBeenCalledTimes(1);
    expect(mockChangeWorkarea).toHaveBeenLastCalledWith('ado1', { toggleModule: false });
    expect(mockToggleDisplay).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('promark rotary settings', () => {
    mockRead.mockImplementation((key) => (key === 'workarea' ? 'fpm1' : undefined));

    const { baseElement, getByText } = render(<RotarySettings onClose={mockOnClose} />);

    expect(baseElement).toMatchSnapshot();

    const rotaryMode = baseElement.querySelector('#rotary_mode');
    const chuckSegmentSelector = getByText('Chuck');
    const chuckDiameter = baseElement.querySelector('#object_diameter');
    const splitSize = baseElement.querySelector('#split');
    const overlapSize = baseElement.querySelector('#overlap');
    const mirrorCheckbox = baseElement.querySelector('#mirror');
    const scaleSelect = baseElement.querySelector('#scale');

    fireEvent.click(rotaryMode);
    fireEvent.click(chuckSegmentSelector);
    fireEvent.change(chuckDiameter, { target: { value: 10 } });
    fireEvent.change(splitSize, { target: { value: 2 } });
    fireEvent.change(overlapSize, { target: { value: 1 } });
    fireEvent.click(mirrorCheckbox);
    act(() => fireEvent.mouseDown(scaleSelect));
    fireEvent.click(baseElement.querySelector('.rc-virtual-list [title="2"]'));

    const saveButton = baseElement.querySelector('.ant-btn-primary');

    fireEvent.click(saveButton);
    expect(mockWrite).toHaveBeenCalledTimes(7);
    expect(mockWrite).toHaveBeenNthCalledWith(1, 'rotary_mode', true);
    expect(mockWrite).toHaveBeenNthCalledWith(2, 'rotary-type', RotaryType.Chuck);
    expect(mockWrite).toHaveBeenNthCalledWith(3, 'rotary-scale', 2);
    expect(mockWrite).toHaveBeenNthCalledWith(4, 'rotary-chuck-obj-d', 10);
    expect(mockWrite).toHaveBeenNthCalledWith(5, 'rotary-mirror', true);
    expect(mockWrite).toHaveBeenNthCalledWith(6, 'rotary-split', 2);
    expect(mockWrite).toHaveBeenNthCalledWith(7, 'rotary-overlap', 1);
    expect(mockChangeWorkarea).toHaveBeenCalledTimes(1);
    expect(mockChangeWorkarea).toHaveBeenLastCalledWith('fpm1', { toggleModule: false });
    expect(mockToggleDisplay).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
