import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import { RotaryType } from 'app/constants/add-on';

import RotarySettings from './RotarySettings';

const mockRead = jest.fn();
const mockWrite = jest.fn();
jest.mock('app/actions/beambox/beambox-preference', () => ({
  read: (...args) => mockRead(...args),
  write: (...args) => mockWrite(...args),
}));

const mockChangeWorkarea = jest.fn();
jest.mock(
  'app/svgedit/operations/changeWorkarea',
  () =>
    (...args) =>
      mockChangeWorkarea(...args)
);

const mockToggleDisplay = jest.fn();
jest.mock('app/actions/canvas/rotary-axis', () => ({
  toggleDisplay: (...args) => mockToggleDisplay(...args),
}));

const mockStorageGet = jest.fn();
jest.mock('implementations/storage', () => ({
  get: (...args) => mockStorageGet(...args),
}));

const mockAddDialogComponent = jest.fn();
const mockIsIdExist = jest.fn();
const mockPopDialogById = jest.fn();
jest.mock('app/actions/dialog-controller', () => ({
  addDialogComponent: (...args) => mockAddDialogComponent(...args),
  isIdExist: (...args) => mockIsIdExist(...args),
  popDialogById: (...args) => mockPopDialogById(...args),
}));

jest.mock('helpers/locale-helper', () => ({
  isTwOrHk: true,
}));

const mockOnClose = jest.fn();

describe('test RotarySettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRead.mockImplementation((key) => {
      if (key === 'workarea') return 'ado1';
      return undefined;
    });
  });

  it('should render correctly', () => {
    const { baseElement } = render(<RotarySettings onClose={mockOnClose} />);
    expect(baseElement).toMatchSnapshot();
  });

  test('disabled and enabled fields', () => {
    const { baseElement, getByText } = render(<RotarySettings onClose={mockOnClose} />);
    const segControl = baseElement.querySelector('#rotary_type');
    expect(segControl).toHaveClass('ant-segmented-disabled');
    const chuckDiameter = baseElement.querySelector('#object_diameter');
    expect(chuckDiameter).toHaveAttribute('disabled');
    const circumference = baseElement.querySelector('#circumference');
    expect(circumference).toHaveAttribute('disabled');
    const mirrorCheckbox = baseElement.querySelector('#mirror');
    expect(mirrorCheckbox.parentNode).toHaveClass('ant-checkbox-disabled');
    const extendCheckbox = baseElement.querySelector('#extend');
    expect(extendCheckbox.parentNode).toHaveClass('ant-checkbox-disabled');
    const rotaryMode = baseElement.querySelector('#rotary_mode');
    fireEvent.click(rotaryMode);
    expect(segControl).not.toHaveClass('ant-segmented-disabled');
    expect(chuckDiameter).toHaveAttribute('disabled');
    expect(circumference).toHaveAttribute('disabled');
    expect(mirrorCheckbox.parentNode).not.toHaveClass('ant-checkbox-disabled');
    expect(extendCheckbox.parentNode).not.toHaveClass('ant-checkbox-disabled');
    const chuckSegmentSelector = getByText('Chuck');
    fireEvent.click(chuckSegmentSelector);
    expect(chuckDiameter).not.toHaveAttribute('disabled');
    expect(circumference).not.toHaveAttribute('disabled');
  });

  test('save settings', () => {
    const { baseElement, getByText } = render(<RotarySettings onClose={mockOnClose} />);
    const rotaryMode = baseElement.querySelector('#rotary_mode');
    fireEvent.click(rotaryMode);
    const chuckSegmentSelector = getByText('Chuck');
    fireEvent.click(chuckSegmentSelector);
    const chuckDiameter = baseElement.querySelector('#object_diameter');
    fireEvent.change(chuckDiameter, { target: { value: 10 } });
    const extendCheckbox = baseElement.querySelector('#extend');
    fireEvent.click(extendCheckbox);

    const saveButton = baseElement.querySelector('.ant-btn-primary');
    fireEvent.click(saveButton);
    expect(mockWrite).toHaveBeenCalledTimes(5);
    expect(mockWrite).toHaveBeenNthCalledWith(1, 'rotary_mode', 1);
    expect(mockWrite).toHaveBeenNthCalledWith(2, 'rotary-type', RotaryType.Chuck);
    expect(mockWrite).toHaveBeenNthCalledWith(3, 'rotary-chuck-obj-d', 10);
    expect(mockWrite).toHaveBeenNthCalledWith(4, 'rotary-mirror', false);
    expect(mockWrite).toHaveBeenNthCalledWith(5, 'extend-rotary-workarea', true);
    expect(mockChangeWorkarea).toHaveBeenCalledTimes(1);
    expect(mockChangeWorkarea).toHaveBeenLastCalledWith('ado1', { toggleModule: false });
    expect(mockToggleDisplay).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
