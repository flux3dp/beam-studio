import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import ParametersBlock from './ParametersBlock';

const mockSetParameters = jest.fn();
const mockParameters = { power: 20, speed: 1000 };

describe('test ParametersBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { container } = render(
      <ParametersBlock isInch={false} parameters={mockParameters} setParameters={mockSetParameters} />,
    );

    expect(container).toMatchSnapshot();
  });

  describe('test edit values', () => {
    [
      { id: 'power', key: 'power' },
      { id: 'speed', key: 'speed' },
    ].forEach(({ id, key }) => {
      test(`edit ${key}`, () => {
        const { getByTestId } = render(
          <ParametersBlock isInch={false} parameters={mockParameters} setParameters={mockSetParameters} />,
        );
        const input = getByTestId(id);

        fireEvent.change(input, { target: { value: '10' } });
        expect(mockSetParameters).toHaveBeenCalledTimes(1);

        const [[dispatch]] = mockSetParameters.mock.calls;

        expect(dispatch(mockParameters)).toEqual({ ...mockParameters, [key]: 10 });
      });
    });
  });
});
