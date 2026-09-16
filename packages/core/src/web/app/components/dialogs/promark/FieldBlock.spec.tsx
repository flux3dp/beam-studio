import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import FieldBlock from './FieldBlock';

const mockSetField = jest.fn();
const mockField = { angle: 0, offsetX: 0, offsetY: 0 };
const mockWidthChange = jest.fn();
const mockFocusHeightChange = jest.fn();

describe('test FieldBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { container } = render(<FieldBlock field={mockField} isInch={false} setField={mockSetField} width={300} />);

    expect(container).toMatchSnapshot();
  });

  describe('galvo variant', () => {
    it('should offer the field lens sizes and hide the module offsets', () => {
      const { queryByTestId } = render(
        <FieldBlock
          field={mockField}
          focusHeight={8}
          hideOffsets
          isInch={false}
          onFocusHeightChange={mockFocusHeightChange}
          onWidthChange={mockWidthChange}
          setField={mockSetField}
          width={110}
          widthOptions={[70, 110]}
        />,
      );

      // the head's position relative to the nozzle is module offset, not field offset
      expect(queryByTestId('offset-x')).not.toBeInTheDocument();
      expect(queryByTestId('offset-y')).not.toBeInTheDocument();
      expect(queryByTestId('field-width')).toBeInTheDocument();
      expect(queryByTestId('angle')).toBeInTheDocument();
    });

    it('should report a focus height change', () => {
      const { getByTestId } = render(
        <FieldBlock
          field={mockField}
          focusHeight={8}
          hideOffsets
          isInch={false}
          onFocusHeightChange={mockFocusHeightChange}
          setField={mockSetField}
          width={110}
          widthOptions={[70, 110]}
        />,
      );

      fireEvent.change(getByTestId('focus-height'), { target: { value: '12.5' } });
      expect(mockFocusHeightChange).toHaveBeenLastCalledWith(12.5);
    });

    it('should keep the plain input when no options are given', () => {
      const { queryByTestId } = render(
        <FieldBlock field={mockField} isInch={false} setField={mockSetField} width={300} />,
      );

      expect(queryByTestId('field-width')).not.toBeInTheDocument();
      expect(queryByTestId('focus-height')).not.toBeInTheDocument();
      expect(queryByTestId('offset-x')).toBeInTheDocument();
    });
  });

  describe('test edit values', () => {
    [
      { id: 'offset-x', key: 'offsetX' },
      { id: 'offset-y', key: 'offsetY' },
      { id: 'angle', key: 'angle' },
    ].forEach(({ id, key }) => {
      test(`edit ${key}`, () => {
        const { getByTestId } = render(
          <FieldBlock field={mockField} isInch={false} setField={mockSetField} width={300} />,
        );
        const input = getByTestId(id);

        fireEvent.change(input, { target: { value: '10' } });
        expect(mockSetField).toHaveBeenCalledTimes(1);

        const [[dispatch]] = mockSetField.mock.calls;

        expect(dispatch(mockField)).toEqual({ ...mockField, [key]: 10 });
      });
    });
  });
});
