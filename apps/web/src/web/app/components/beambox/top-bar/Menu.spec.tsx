/* eslint-disable import/first */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';

const read = jest.fn();
jest.mock('app/actions/beambox/beambox-preference', () => ({
  read,
}));

const open = jest.fn();
jest.mock('implementations/browser', () => ({
  open,
}));

const mockDiscoverRemoveListener = jest.fn();
jest.mock('helpers/api/discover', () => () => ({
  removeListener: mockDiscoverRemoveListener,
}));

const emit = jest.fn();
const on = jest.fn();
const removeListener = jest.fn();
jest.mock('helpers/eventEmitterFactory', () => ({
  createEventEmitter: () => ({
    emit,
    on,
    removeListener,
  }),
}));

window.os = 'MacOS';

import Menu from './Menu';

describe('should render correctly', () => {
  test('open the browser and reach the correct page', () => {
    read.mockReturnValue(true);
    const { container, getByText } = render(<Menu email={undefined} />);
    expect(container).toMatchSnapshot();

    fireEvent.click(container.querySelector('div.menu-btn-container'));
    expect(container).toMatchSnapshot();

    fireEvent.click(getByText('Help'));
    expect(container).toMatchSnapshot();

    fireEvent.click(getByText('Help Center'));
    expect(open).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenNthCalledWith(1, 'https://helpcenter.flux3dp.com/');
  });

  test('test checkbox menu item', () => {
    read.mockReturnValue(false);
    const { container, getByText } = render(<Menu email={undefined} />);
    expect(container).toMatchSnapshot();

    fireEvent.click(container.querySelector('div.menu-btn-container'));
    fireEvent.click(getByText('View'));
    expect(container).toMatchSnapshot();

    fireEvent.click(getByText('Show Rulers'));
    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenNthCalledWith(1, 'MENU_CLICK', null, {
      id: 'SHOW_RULERS',
    });
    expect(container).toMatchSnapshot();
  });

  test('already signed in', () => {
    read.mockReturnValue(true);
    const { container, getByText } = render(<Menu email="tester@flux3dp.com" />);
    fireEvent.click(container.querySelector('div.menu-btn-container'));
    fireEvent.click(getByText('Account'));
    expect(container).toMatchSnapshot();
  });
});
