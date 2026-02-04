import React from 'react';

import { render } from '@testing-library/react';

import MockNumberBlock from '@mocks/@core/app/components/beambox/RightPanel/ConfigPanel/NumberBlock';

jest.mock('./NumberBlock', () => MockNumberBlock);

import FrequencyBlock from './FrequencyBlock';

describe('test FrequencyBlock', () => {
  it('should render correctly', () => {
    const { container } = render(<FrequencyBlock max={60} min={27} />);

    expect(container).toMatchSnapshot();
  });
});
