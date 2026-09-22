import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import FieldBlock from './FieldBlock';

const mockSetField = jest.fn();
const mockField = { angle: 0, offsetX: 0, offsetY: 0 };
const mockWidthChange = jest.fn();

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
          isInch={false}
          onWidthChange={mockWidthChange}
          setField={mockSetField}
          width={110}
          widthOptions={[70, 110]}
        />,
      );

    // the field lens size is picked here; everything else in this block is the galvo's own optics
    it('should offer the field lens sizes', () => {
      const { queryByTestId } = renderGalvo();

      expect(queryByTestId('field-width')).toBeInTheDocument();
      expect(queryByTestId('angle')).toBeInTheDocument();
      expect(queryByTestId('offset-x')).toBeInTheDocument();
    });

    // focus height and the module offset belong to GalvoModuleBlock, not here
    it('should not show a focus height', () => {
      const { queryByTestId } = renderGalvo();

      expect(queryByTestId('focus-height')).not.toBeInTheDocument();
    });

    it('should keep the plain input when no options are given', () => {
      const { queryByTestId } = render(
        <FieldBlock field={mockField} isInch={false} setField={mockSetField} width={300} />,
      );

      expect(queryByTestId('field-width')).not.toBeInTheDocument();
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
