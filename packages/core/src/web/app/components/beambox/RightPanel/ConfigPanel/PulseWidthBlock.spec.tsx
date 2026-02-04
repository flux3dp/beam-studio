import React from 'react';

import { render } from '@testing-library/react';

import MockNumberBlock from '@mocks/@core/app/components/beambox/RightPanel/ConfigPanel/NumberBlock';

jest.mock('./NumberBlock', () => MockNumberBlock);

import PulseWidthBlock from './PulseWidthBlock';

describe('test PulseWidthBlock', () => {
  it('should render correctly', () => {
    const { container } = render(<PulseWidthBlock max={350} min={2} />);

    expect(container).toMatchSnapshot();
  });
});
