import React from 'react';

import { render } from '@testing-library/react';

import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

import DpiInfo from './DpiInfo';

const mockRead = jest.fn();

jest.mock('@core/app/actions/beambox/beambox-preference', () => ({
  read: () => mockRead(),
}));

const mockUseIsMobile = jest.fn();

jest.mock('@core/helpers/system-helper', () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

describe('test DpiInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', async () => {
    const eventEmitter = eventEmitterFactory.createEventEmitter('beambox-preference');

    mockRead.mockReturnValue('low');

    const { container } = render(<DpiInfo />);

    expect(container).toMatchSnapshot();

    eventEmitter.emit('engrave_dpi', 'high');
    await new Promise((resolve) => setTimeout(resolve));
    expect(container).toMatchSnapshot();
  });

  it('should render correctly in mobile', () => {
    mockUseIsMobile.mockReturnValue(true);
    mockRead.mockReturnValue('ultra');

    const { container } = render(<DpiInfo />);

    expect(container).toMatchSnapshot();
  });
});
