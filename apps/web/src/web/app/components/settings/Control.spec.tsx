import * as React from 'react';
import { fireEvent, render } from '@testing-library/react';

const open = jest.fn();
jest.mock('implementations/browser', () => ({
  open,
}));

const useIsMobile = jest.fn();
jest.mock('helpers/system-helper', () => ({
  useIsMobile: () => useIsMobile(),
}));

// eslint-disable-next-line import/first
import Control from './Control';

describe('test Control', () => {
  it('should render correctly', () => {
    const { container, rerender } = render(
      <Control label="Flux">
        <div>Hello World</div>
      </Control>
    );
    expect(container).toMatchSnapshot();

    rerender(
      <Control label="Flux" url="https://www.flux3dp.com" warningText="Warning!!">
        <div>Hello World</div>
      </Control>
    );
    expect(container).toMatchSnapshot();

    fireEvent.click(container.querySelector('img'));
    expect(open).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenNthCalledWith(1, 'https://www.flux3dp.com');
  });

  it('should render correctly in mobile', () => {
    useIsMobile.mockReturnValue(true);
    const { container } = render(
      <Control label="Flux">
        <div>Hello World</div>
      </Control>
    );
    expect(container).toMatchSnapshot();
  });
});
