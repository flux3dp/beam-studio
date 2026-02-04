import * as React from 'react';

import { fireEvent, render } from '@testing-library/react';

const useIsMobile = jest.fn();

jest.mock('@core/helpers/system-helper', () => ({
  useIsMobile: () => useIsMobile(),
}));

const getSVGAsync = jest.fn();

jest.mock('@core/helpers/svg-editor-helper', () => ({
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

jest.mock('@core/app/svgedit/history/utils', () => ({
  redo,
  undo,
}));

import CommonTools from './CommonTools';

describe('should render correctly', () => {
  test('hide', () => {
    const { container } = render(<CommonTools hide />);

    expect(container).toBeEmptyDOMElement();
  });

  test('is mobile', () => {
    useIsMobile.mockReturnValue(true);

    const { container } = render(<CommonTools hide={false} />);

    expect(container).toMatchSnapshot();
  });

  test('not hiding, not mobile and in web version', () => {
    useIsMobile.mockReturnValue(false);

    const { container } = render(<CommonTools hide={false} />);

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
