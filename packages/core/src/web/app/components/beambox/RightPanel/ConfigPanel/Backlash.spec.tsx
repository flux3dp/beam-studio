import React from 'react';

import { render } from '@testing-library/react';

import MockNumberBlock from '@mocks/@core/app/components/beambox/RightPanel/ConfigPanel/NumberBlock';

jest.mock('./NumberBlock', () => MockNumberBlock);

import Backlash from './Backlash';

describe('test Backlash', () => {
  it('should render correctly', () => {
    const { container } = render(<Backlash />);

    expect(container).toMatchSnapshot();
  });
});
