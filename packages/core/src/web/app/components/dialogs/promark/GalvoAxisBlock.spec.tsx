import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import GalvoAxisBlock from './GalvoAxisBlock';

const mockSetField = jest.fn();
const mockField = { angle: 0, invertX: false, invertY: true, offsetX: 0, offsetY: 0, swapXY: false };

describe('test GalvoAxisBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { container } = render(<GalvoAxisBlock field={mockField} setField={mockSetField} />);

    expect(container).toMatchSnapshot();
  });

  // A machine configured before these keys existed answers without them; the switches still have
  // to render rather than going uncontrolled.
  it('should treat a missing value as off', () => {
    const { getByTestId } = render(
      <GalvoAxisBlock field={{ angle: 0, offsetX: 0, offsetY: 0 }} setField={mockSetField} />,
    );

    expect(getByTestId('swapXY')).toHaveAttribute('aria-checked', 'false');
  });

  it.each(['swapXY', 'invertX', 'invertY'] as const)('toggles %s', (key) => {
    const { getByTestId } = render(<GalvoAxisBlock field={mockField} setField={mockSetField} />);

    fireEvent.click(getByTestId(key));
    expect(mockSetField).toHaveBeenCalledTimes(1);

    const [[dispatch]] = mockSetField.mock.calls;

    expect(dispatch(mockField)).toEqual({ ...mockField, [key]: !mockField[key] });
  });
});
