import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import SaveFileModal from './SaveFileModal';

jest.mock('helpers/useI18n', () => () => ({
  topbar: {
    untitled: 'Untitled',
    menu: {
      save_to_cloud: 'Save to Cloud',
    },
  },
  my_cloud: {
    save_file: {
      choose_action: 'Save File',
      save: 'Save',
      save_new: 'Save as new file',
      input_file_name: 'Input file name:',
      invalid_char: 'Invalid characters:',
    },
  },
}));

const mockGetName = jest.fn();
jest.mock('app/svgedit/currentFileManager', () => ({
  __esModule: true,
  default: {
    getName: () => mockGetName(),
  },
}));

const mockOnClose = jest.fn();

describe('test SaveFileModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should rendered correctly', () => {
    const { baseElement, getByText } = render(<SaveFileModal onClose={mockOnClose} />);
    expect(baseElement).toMatchSnapshot();
    const input = baseElement.querySelector('input');
    fireEvent.change(input, { target: { value: 'invalid/text' } });
    expect(input).toHaveClass('ant-input-status-error');
    expect(baseElement).toMatchSnapshot();
    fireEvent.change(input, { target: { value: 'a file name' } });
    fireEvent.click(getByText('OK'));
    expect(mockOnClose).toBeCalledTimes(1);
    expect(mockOnClose).toBeCalledWith('a file name');
  });

  test('should save to old file correctly with uuid', () => {
    const { baseElement, getByText } = render(
      <SaveFileModal onClose={mockOnClose} uuid="mock-uuid" />
    );
    expect(baseElement).toMatchSnapshot();
    fireEvent.click(getByText('Save'));
    expect(mockOnClose).toBeCalledTimes(1);
    expect(mockOnClose).toBeCalledWith(null);
  });

  test('should save to another file correctly with uuid', () => {
    mockGetName.mockReturnValueOnce('/path/old file name');
    const { baseElement, getByText } = render(
      <SaveFileModal onClose={mockOnClose} uuid="mock-uuid" />
    );
    fireEvent.click(getByText('Save as new file'));
    expect(baseElement).toMatchSnapshot();
    const input = baseElement.querySelector('input');
    fireEvent.change(input, { target: { value: 'new file name' } });
    fireEvent.click(getByText('OK'));
    expect(mockOnClose).toBeCalledTimes(1);
    expect(mockOnClose).toBeCalledWith('new file name');
  });

  test('should behave correctly when cancelled', () => {
    const { baseElement } = render(<SaveFileModal onClose={mockOnClose} />);
    fireEvent.click(baseElement.querySelector('.anticon-close'));
    expect(mockOnClose).toBeCalledTimes(1);
    expect(mockOnClose).toBeCalledWith(null, true);
  });
});
