import React, { act } from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react';

import { RotaryType } from '@core/app/constants/addOn';

import RotarySettings from './RotarySettings';

const mockUpdate = jest.fn();
const mockGetState = jest.fn();

jest.mock('@core/app/stores/documentStore', () => ({
  useDocumentStore: { getState: () => mockGetState() },
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

const mockAddDialogComponent = jest.fn();
const mockIsIdExist = jest.fn();
const mockPopDialogById = jest.fn();

jest.mock('@core/app/actions/dialog-controller', () => ({
  addDialogComponent: (...args) => mockAddDialogComponent(...args),
  isIdExist: (...args) => mockIsIdExist(...args),
  popDialogById: (...args) => mockPopDialogById(...args),
}));

const mockIsInnerEngravingActive = jest.fn();

// the real module stays in place for setExclusiveMode's handlers; only the active check is faked
jest.mock('@core/helpers/addOn/innerEngraving', () => ({
  ...jest.requireActual('@core/helpers/addOn/innerEngraving'),
  isInnerEngravingActive: () => mockIsInnerEngravingActive(),
}));

const mockAskModeSwitch = jest.fn();

jest.mock('@core/app/svgedit/operations/import/innerEngravingGate', () => ({
  askModeSwitch: (...args) => mockAskModeSwitch(...args),
}));

const mockSwitchInnerEngravingMode = jest.fn();

jest.mock('@core/app/actions/canvas/innerEngravingMode', () => ({
  switchInnerEngravingMode: (...args) => mockSwitchInnerEngravingMode(...args),
}));

const mockOnClose = jest.fn();

describe('test RotarySettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsInnerEngravingActive.mockReturnValue(false);
    mockGetState.mockReturnValue({
      update: mockUpdate,
      workarea: 'ado1',
    });
  });

  describe('enabling the rotary in an inner engraving document', () => {
    beforeEach(() => {
      mockIsInnerEngravingActive.mockReturnValue(true);
      mockGetState.mockReturnValue({ 'inner-engraving': true, update: mockUpdate, workarea: 'fpm1' });
    });

    const enableRotaryAndSave = (baseElement: Element) => {
      fireEvent.click(baseElement.querySelector('#rotary_mode')!);
      fireEvent.click(baseElement.querySelector('.ant-btn-primary')!);
    };

    test('asks, switches the mode off, then saves', async () => {
      mockAskModeSwitch.mockResolvedValue(true);
      mockSwitchInnerEngravingMode.mockResolvedValue(true);

      const { baseElement } = render(<RotarySettings onClose={mockOnClose} />);

      enableRotaryAndSave(baseElement);
      await waitFor(() => expect(mockOnClose).toHaveBeenCalledTimes(1));
      expect(mockAskModeSwitch).toHaveBeenCalledTimes(1);
      expect(mockSwitchInnerEngravingMode).toHaveBeenCalledWith(false);
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ rotary_mode: true }));
    });

    test('keeps the dialog open and the document untouched when the prompt is declined', async () => {
      mockAskModeSwitch.mockResolvedValue(false);

      const { baseElement } = render(<RotarySettings onClose={mockOnClose} />);

      enableRotaryAndSave(baseElement);
      await waitFor(() => expect(mockAskModeSwitch).toHaveBeenCalledTimes(1));
      expect(mockSwitchInnerEngravingMode).not.toHaveBeenCalled();
      expect(mockUpdate).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    test('keeps the dialog open when the new-document switch is cancelled', async () => {
      mockAskModeSwitch.mockResolvedValue(true);
      mockSwitchInnerEngravingMode.mockResolvedValue(false);

      const { baseElement } = render(<RotarySettings onClose={mockOnClose} />);

      enableRotaryAndSave(baseElement);
      await waitFor(() => expect(mockSwitchInnerEngravingMode).toHaveBeenCalledWith(false));
      expect(mockUpdate).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    test('saves directly when the rotary is being turned off', () => {
      mockGetState.mockReturnValue({
        'inner-engraving': true,
        rotary_mode: true,
        update: mockUpdate,
        workarea: 'fpm1',
      });

      const { baseElement } = render(<RotarySettings onClose={mockOnClose} />);

      fireEvent.click(baseElement.querySelector('#rotary_mode')!);
      fireEvent.click(baseElement.querySelector('.ant-btn-primary')!);
      expect(mockAskModeSwitch).not.toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ rotary_mode: false }));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
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
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith({
      'auto-feeder': false,
      'extend-rotary-workarea': true,
      'inner-engraving': false,
      'pass-through': false,
      'rotary-chuck-obj-d': 10,
      'rotary-mirror': false,
      'rotary-scale': 2,
      'rotary-type': RotaryType.Chuck,
      rotary_mode: true,
    });
    expect(mockChangeWorkarea).toHaveBeenCalledTimes(1);
    expect(mockChangeWorkarea).toHaveBeenLastCalledWith('ado1', { toggleModule: false });
    expect(mockToggleDisplay).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('promark rotary settings', () => {
    mockGetState.mockReturnValue({
      'rotary-split': 3.45,
      update: mockUpdate,
      workarea: 'fpm1',
    });

    const { baseElement, getByText } = render(<RotarySettings onClose={mockOnClose} />);

    expect(baseElement).toMatchSnapshot();

    const rotaryMode = baseElement.querySelector('#rotary_mode');
    const chuckSegmentSelector = getByText('Chuck');
    const chuckDiameter = baseElement.querySelector('#object_diameter');
    const splitSize = baseElement.querySelector('#split');
    const overlapSize = baseElement.querySelector('#overlap');
    const mirrorCheckbox = baseElement.querySelector('#mirror');
    const extendCheckbox = baseElement.querySelector('#extend');
    const scaleSelect = baseElement.querySelector('#scale');

    fireEvent.click(rotaryMode);
    fireEvent.click(chuckSegmentSelector);
    fireEvent.change(chuckDiameter, { target: { value: 10 } });
    fireEvent.change(splitSize, { target: { value: 2 } });
    fireEvent.change(overlapSize, { target: { value: 1 } });
    fireEvent.click(mirrorCheckbox);
    fireEvent.click(extendCheckbox);
    act(() => fireEvent.mouseDown(scaleSelect));
    fireEvent.click(baseElement.querySelector('.rc-virtual-list [title="2"]'));

    const saveButton = baseElement.querySelector('.ant-btn-primary');

    fireEvent.click(saveButton);
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenLastCalledWith({
      'auto-feeder': false,
      'extend-rotary-workarea': true,
      'inner-engraving': false,
      'pass-through': false,
      'rotary-chuck-obj-d': 10,
      'rotary-mirror': true,
      'rotary-overlap': 1,
      'rotary-scale': 2,
      'rotary-split': 2,
      'rotary-type': RotaryType.Chuck,
      rotary_mode: true,
    });
    expect(mockChangeWorkarea).toHaveBeenCalledTimes(1);
    expect(mockChangeWorkarea).toHaveBeenLastCalledWith('fpm1', { toggleModule: false });
    expect(mockToggleDisplay).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
