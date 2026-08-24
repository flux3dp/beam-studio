import React from 'react';

import { render } from '@testing-library/react';

import MockNumberBlock from '@mocks/@core/app/components/beambox/RightPanel/ConfigPanel/NumberBlock';

jest.mock('./NumberBlock', () => MockNumberBlock);

const mockUsePromarkLimit = jest.fn();

jest.mock('./usePromarkLimit', () => mockUsePromarkLimit);

import PulseWidthBlock from './PulseWidthBlock';

describe('test PulseWidthBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    mockUsePromarkLimit.mockReturnValue({ frequency: { max: 4000, min: 1 }, pulseWidth: { max: 350, min: 2 } });

    const { container } = render(<PulseWidthBlock />);

    expect(container).toMatchSnapshot();
  });

  it('should render nothing when there is no pulseWidth limit', () => {
    mockUsePromarkLimit.mockReturnValue({ frequency: { max: 60, min: 27 } });

    const { container } = render(<PulseWidthBlock />);

    expect(container).toBeEmptyDOMElement();
  });
});
