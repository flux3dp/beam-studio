import React from 'react';

import { render } from '@testing-library/react';

import MockNumberBlock from '@mocks/@core/app/components/beambox/RightPanel/ConfigPanel/NumberBlock';

jest.mock('./NumberBlock', () => MockNumberBlock);

const mockUsePromarkLimit = jest.fn();

jest.mock('./usePromarkLimit', () => mockUsePromarkLimit);

import FrequencyBlock from './FrequencyBlock';

describe('test FrequencyBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    mockUsePromarkLimit.mockReturnValue({ frequency: { max: 60, min: 27 } });

    const { container } = render(<FrequencyBlock />);

    expect(container).toMatchSnapshot();
  });
});
