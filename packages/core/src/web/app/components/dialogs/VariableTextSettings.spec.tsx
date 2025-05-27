import React from 'react';

import { fireEvent, render } from '@testing-library/react';

const mockSetVariableTextState = jest.fn();
const mockUseVariableTextState = jest.fn().mockReturnValue({
  advanceBy: 1,
  autoAdvance: true,
  csvContent: [['XXX']],
  csvFileName: 'file_name.csv',
  current: 1,
  end: 999,
  start: 0,
});

jest.mock('@core/app/stores/variableText', () => ({
  setVariableTextState: mockSetVariableTextState,
  useVariableTextState: mockUseVariableTextState,
}));

const mockRevertVariableText = jest.fn();
const mockConvertVariableText = jest.fn().mockResolvedValue(mockRevertVariableText);

jest.mock('@core/helpers/variableText', () => ({
  convertVariableText: mockConvertVariableText,
}));

const mockGetFileFromDialog = jest.fn();

jest.mock('@core/implementations/dialog', () => ({
  getFileFromDialog: mockGetFileFromDialog,
}));

const mockOnClose = jest.fn();

import VariableTextSettings from './VariableTextSettings';

describe('test VariableTextSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('form fields', () => {
    const { baseElement, getByText } = render(<VariableTextSettings onClose={mockOnClose} />);

    expect(baseElement).toMatchSnapshot();

    fireEvent.input(baseElement.querySelector('#current'), { target: { value: '1' } });
    fireEvent.input(baseElement.querySelector('#start'), { target: { value: '2' } });
    fireEvent.input(baseElement.querySelector('#end'), { target: { value: '10' } });
    fireEvent.input(baseElement.querySelector('#advanceBy'), { target: { value: '20' } });
    fireEvent.click(baseElement.querySelector('#autoAdvance'));
    fireEvent.click(getByText('Clear'));
    expect(baseElement).toMatchSnapshot();

    fireEvent.click(getByText('OK'));
    expect(mockSetVariableTextState).toHaveBeenCalledWith({
      advanceBy: 20,
      autoAdvance: false,
      csvContent: [],
      csvFileName: '',
      current: 1,
      end: 10,
      start: 2,
    });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('edit buttons', async () => {
    const { baseElement, getByText } = render(<VariableTextSettings onClose={mockOnClose} />);
    const currentInput = baseElement.querySelector('#current') as HTMLInputElement;
    const previousButton = baseElement.querySelector('.row button');

    expect(previousButton).not.toBeDisabled();
    fireEvent.click(getByText('Previous'));
    expect(currentInput.value).toBe('0');
    expect(previousButton).toBeDisabled();

    fireEvent.click(getByText('Next'));
    expect(currentInput.value).toBe('1');
    fireEvent.click(getByText('Next'));
    expect(currentInput.value).toBe('2');

    fireEvent.mouseDown(getByText('Test'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockConvertVariableText).toHaveBeenCalled();
    expect(mockConvertVariableText).toHaveBeenNthCalledWith(1, {
      configs: {
        advanceBy: 1,
        autoAdvance: true,
        csvContent: [['XXX']],
        csvFileName: 'file_name.csv',
        current: 2,
        end: 999,
        start: 0,
      },
    });
    expect(mockRevertVariableText).not.toHaveBeenCalled();
    fireEvent.mouseUp(getByText('Test'));
    expect(mockRevertVariableText).toHaveBeenCalled();

    fireEvent.click(getByText('Finalize'));
    expect(mockConvertVariableText).toHaveBeenCalledTimes(2);
    expect(mockConvertVariableText).toHaveBeenNthCalledWith(2, {
      addToHistory: true,
      configs: {
        advanceBy: 1,
        autoAdvance: true,
        csvContent: [['XXX']],
        csvFileName: 'file_name.csv',
        current: 2,
        end: 999,
        start: 0,
      },
    });

    fireEvent.click(getByText('Browse'));
    expect(mockGetFileFromDialog).toHaveBeenCalled();
  });
});
