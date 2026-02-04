import React from 'react';

import { render } from '@testing-library/react';

import MockNumberBlock from '@mocks/@core/app/components/beambox/RightPanel/ConfigPanel/NumberBlock';

jest.mock('./NumberBlock', () => MockNumberBlock);

import RepeatBlock from './RepeatBlock';

describe('test RepeatBlock', () => {
  it('should render correctly', () => {
    const { container } = render(<RepeatBlock />);

    expect(container).toMatchSnapshot();
  });
});
