/* eslint-disable import/first */
import * as React from 'react';
import { fireEvent, render } from '@testing-library/react';

enum VerticalAlign {
  BOTTOM = 0,
  MIDDLE = 1,
  TOP = 2,
}

jest.mock('app/actions/beambox/textPathEdit', () => ({
  VerticalAlign,
}));

const useIsMobile = jest.fn();
jest.mock('helpers/system-helper', () => ({
  useIsMobile: () => useIsMobile(),
}));

jest.mock('helpers/i18n', () => ({
  lang: {
    beambox: {
      right_panel: {
        object_panel: {
          option_panel: {
            vertical_align: 'Vertical Align',
          },
          bottom_align: 'Bottom Align',
          middle_align: 'Middle Align',
          top_align: 'Top Align',
        },
      },
    },
  },
}));

import VerticalAlignBlock from './VerticalAlignBlock';

describe('test VerticalAlignBlock', () => {
  test('should render correctly', () => {
    const onValueChange = jest.fn();
    const { baseElement, getByRole, getByText } = render(
      <VerticalAlignBlock value={VerticalAlign.BOTTOM} onValueChange={onValueChange} />
    );
    expect(baseElement).toMatchSnapshot();

    fireEvent.mouseDown(getByRole('combobox'));
    expect(baseElement).toMatchSnapshot();

    fireEvent.click(getByText('Top Align'));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenNthCalledWith(1, VerticalAlign.TOP);
  });

  test('should render correctly in mobile', () => {
    useIsMobile.mockReturnValue(true);
    const onValueChange = jest.fn();
    const { container } = render(
      <VerticalAlignBlock value={VerticalAlign.BOTTOM} onValueChange={onValueChange} />
    );
    expect(container).toMatchSnapshot();
  });
});
