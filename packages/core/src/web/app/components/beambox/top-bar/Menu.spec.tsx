import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { __setMockOS } from '@mocks/@core/helpers/getOS';

const defaultGlobalPreference = {
  'anti-aliasing': true,
  auto_align: true,
  'enable-uv-print-file': true,
  show_grids: true,
  show_rulers: true,
  use_layer_color: true,
  zoom_with_window: true,
};
const mockGlobalPreference = { ...defaultGlobalPreference };
const mockUseGlobalPreferenceStore = jest.fn();

jest.mock('@core/app/stores/globalPreferenceStore', () => ({
  useGlobalPreferenceStore: mockUseGlobalPreferenceStore,
}));

const open = jest.fn();

jest.mock('@core/implementations/browser', () => ({
  open,
}));

const mockRegister = jest.fn();
const mockUnregister = jest.fn();

jest.mock('@core/helpers/api/discover', () => ({
  discoverManager: {
    register: mockRegister,
  },
}));

const emit = jest.fn();
const on = jest.fn();
const removeListener = jest.fn();

jest.mock('@core/helpers/eventEmitterFactory', () => ({
  createEventEmitter: () => ({
    emit,
    on,
    removeListener,
  }),
}));

__setMockOS('MacOS');

import Menu from './Menu';

describe('should render correctly', () => {
  beforeEach(() => {
    Object.assign(mockGlobalPreference, defaultGlobalPreference);
    mockUseGlobalPreferenceStore.mockImplementation((selector) => selector(mockGlobalPreference));
    mockRegister.mockReturnValue(mockUnregister);
  });

  test('open the browser and reach the correct page', () => {
    mockUseGlobalPreferenceStore.mockReturnValue(true);

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
    const keys = Object.keys(mockGlobalPreference);

    for (const key of keys) {
      mockGlobalPreference[key] = false;
    }

    const { container, getByText, rerender } = render(<Menu />);

    expect(container).toMatchSnapshot();

    fireEvent.click(container.querySelector('div.menu-btn-container'));
    fireEvent.click(getByText('View'));
    expect(container).toMatchSnapshot();

    fireEvent.click(getByText('Show Rulers'));
    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenNthCalledWith(1, 'MENU_CLICK', null, {
      id: 'SHOW_RULERS',
    });
    mockGlobalPreference.show_rulers = true;
    rerender(<Menu />);
    expect(container).toMatchSnapshot();
  });

  test('already signed in', () => {
    mockUseGlobalPreferenceStore.mockReturnValue(true);

    const { container, getByText } = render(<Menu email="tester@flux3dp.com" />);

    fireEvent.click(container.querySelector('div.menu-btn-container'));
    fireEvent.click(getByText('Account'));
    expect(container).toMatchSnapshot();
  });
});
