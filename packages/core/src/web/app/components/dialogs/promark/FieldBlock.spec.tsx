import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import FieldBlock from './FieldBlock';

const mockSetField = jest.fn();
const mockField = { angle: 0, offsetX: 0, offsetY: 0 };
const mockWidthChange = jest.fn();
const mockFocusHeightChange = jest.fn();
const mockOffsetsChange = jest.fn();

describe('test FieldBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { container } = render(<FieldBlock field={mockField} isInch={false} setField={mockSetField} width={300} />);

    expect(container).toMatchSnapshot();
  });

  describe('galvo variant', () => {
    const renderGalvo = () =>
      render(
        <FieldBlock
          field={mockField}
          focusHeight={8}
          isInch={false}
          offsets={{ x: 1.5, y: -2 }}
          onFocusHeightChange={mockFocusHeightChange}
          onOffsetsChange={mockOffsetsChange}
          onWidthChange={mockWidthChange}
          setField={mockSetField}
          width={110}
          widthOptions={[70, 110]}
        />,
      );

    it('should offer the field lens sizes', () => {
      const { queryByTestId } = renderGalvo();

      expect(queryByTestId('field-width')).toBeInTheDocument();
      expect(queryByTestId('angle')).toBeInTheDocument();
    });

    // the head's position relative to the nozzle is module offset, held in toolhead_shift, so the
    // dialog owns these two numbers and the field's own offsets stay untouched
    it('should show the offsets it was given rather than the field ones', () => {
      const { getByTestId } = renderGalvo();

      expect(getByTestId('offset-x')).toHaveValue('1.5');
      expect(getByTestId('offset-y')).toHaveValue('-2');
    });

    it('should report an offset change without writing to the field', () => {
      const { getByTestId } = renderGalvo();

      fireEvent.change(getByTestId('offset-x'), { target: { value: '10' } });
      expect(mockOffsetsChange).toHaveBeenLastCalledWith({ x: 10, y: -2 });

      fireEvent.change(getByTestId('offset-y'), { target: { value: '4' } });
      expect(mockOffsetsChange).toHaveBeenLastCalledWith({ x: 1.5, y: 4 });

      expect(mockSetField).not.toHaveBeenCalled();
    });

    it('should report a focus height change', () => {
      const { getByTestId } = renderGalvo();

      fireEvent.change(getByTestId('focus-height'), { target: { value: '12.5' } });
      expect(mockFocusHeightChange).toHaveBeenLastCalledWith(12.5);
    });

    it('should keep the plain input when no options are given', () => {
      const { queryByTestId } = render(
        <FieldBlock field={mockField} isInch={false} setField={mockSetField} width={300} />,
      );

      expect(queryByTestId('field-width')).not.toBeInTheDocument();
      expect(queryByTestId('focus-height')).not.toBeInTheDocument();
      // without an offsets prop the rows fall back to the field's own numbers
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
