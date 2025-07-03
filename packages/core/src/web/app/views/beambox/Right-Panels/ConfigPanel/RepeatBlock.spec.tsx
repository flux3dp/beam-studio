import React from 'react';

import { render } from '@testing-library/react';

import MockNumberBlock from '@mocks/@core/app/views/beambox/Right-Panels/ConfigPanel/NumberBlock';

jest.mock('./NumberBlock', () => MockNumberBlock);

const mockUseConfigPanelStore = jest.fn().mockReturnValue({ repeat: { value: 0 } });

jest.mock('@core/app/stores/configPanel', () => ({
  useConfigPanelStore: (...args) => mockUseConfigPanelStore(...args),
}));

const mockUpdate = jest.fn();

jest.mock('@core/app/actions/canvas/module-boundary-drawer', () => ({ update: mockUpdate }));

import RepeatBlock from './RepeatBlock';

describe('test RepeatBlock', () => {
  it('should render correctly', () => {
    const { container } = render(<RepeatBlock />);

    expect(container).toMatchSnapshot();
  });
});
