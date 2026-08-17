import React from 'react';

import { render } from '@testing-library/react';

import MockNumberBlock from '@mocks/@core/app/components/beambox/RightPanel/ConfigPanel/NumberBlock';

jest.mock('./NumberBlock', () => MockNumberBlock);

const mockGetPromarkLimit = jest.fn();

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  getPromarkLimit: () => mockGetPromarkLimit(),
}));

const mockOn = jest.fn();
const mockOff = jest.fn();

jest.mock('@core/helpers/eventEmitterFactory', () => ({
  createEventEmitter: () => ({ off: mockOff, on: mockOn }),
}));

import FrequencyBlock from './FrequencyBlock';

describe('test FrequencyBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    mockGetPromarkLimit.mockReturnValue({ frequency: { max: 60, min: 27 } });

    const { container } = render(<FrequencyBlock />);

    expect(container).toMatchSnapshot();
  });
});
