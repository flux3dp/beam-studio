import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import AboutBeamStudio from './AboutBeamStudio';

jest.mock('helpers/i18n', () => ({
  lang: {
    topmenu: {
      version: 'Version',
      credit: 'credit',
      ok: 'OK',
    },
  },
}));

window.FLUX = {
  version: '1.2.3',
} as any;

describe('test AboutBeamStudio', () => {
  beforeAll(() => {
    jest.spyOn(Date.prototype, 'getFullYear').mockReturnValue(1976);
  });

  it('should render correctly', () => {
    const onClose = jest.fn();
    const { baseElement, getByText } = render(<AboutBeamStudio onClose={onClose} />);
    expect(baseElement).toMatchSnapshot();
    expect(onClose).not.toBeCalled();
    fireEvent.click(getByText('OK'));
    expect(onClose).toBeCalledTimes(1);
  });

  afterAll(() => {
    jest.resetAllMocks();
  });
});
