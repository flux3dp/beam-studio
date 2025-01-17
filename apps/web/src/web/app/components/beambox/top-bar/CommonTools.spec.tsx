/* eslint-disable import/first */
import * as React from 'react';
import { fireEvent, render } from '@testing-library/react';

jest.mock('helpers/i18n', () => ({
  lang: {
    topbar: {
      menu: {
        undo: 'Undo',
        redo: 'Redo',
        delete: 'Delete',
      },
    },
  },
}));

const useIsMobile = jest.fn();
jest.mock('helpers/system-helper', () => ({
  useIsMobile: () => useIsMobile(),
}));

const getSVGAsync = jest.fn();
jest.mock('helpers/svg-editor-helper', () => ({
  getSVGAsync,
}));

const deleteSelected = jest.fn();
getSVGAsync.mockImplementation((callback) => {
  callback({
    Editor: {
      deleteSelected,
    },
  });
});

const undo = jest.fn();
const redo = jest.fn();
jest.mock('app/svgedit/history/utils', () => ({
  undo,
  redo,
}));

import CommonTools from './CommonTools';

describe('should render correctly', () => {
  test('is not web version', () => {
    const { container } = render(<CommonTools isWeb={false} hide={false} />);
    expect(container).toMatchSnapshot();
  });

  test('hide', () => {
    const { container } = render(<CommonTools isWeb hide />);
    expect(container).toMatchSnapshot();
  });

  test('is mobile', () => {
    useIsMobile.mockReturnValue(true);
    const { container } = render(<CommonTools isWeb hide={false} />);
    expect(container).toMatchSnapshot();
  });

  test('not hiding, not mobile and in web version', () => {
    useIsMobile.mockReturnValue(false);
    const { container } = render(<CommonTools isWeb hide={false} />);
    expect(container).toMatchSnapshot();

    const buttons = container.querySelectorAll('div.common-tools-container > div');
    fireEvent.click(buttons[0]);
    expect(undo).toHaveBeenCalledTimes(1);

    fireEvent.click(buttons[1]);
    expect(redo).toHaveBeenCalledTimes(1);

    fireEvent.click(buttons[2]);
    expect(deleteSelected).toHaveBeenCalledTimes(1);
  });
});
