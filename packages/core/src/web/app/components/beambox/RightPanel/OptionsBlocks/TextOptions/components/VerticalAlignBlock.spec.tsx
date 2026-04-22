import * as React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { useScreenStore } from '@core/app/stores/screenStore';

enum VerticalAlign {
  BOTTOM = 0,
  MIDDLE = 1,
  TOP = 2,
}

jest.mock('@core/app/actions/beambox/textPathEdit', () => ({ VerticalAlign }));

jest.mock('@core/app/components/beambox/RightPanel/ObjectPanelItem');

import VerticalAlignBlock from './VerticalAlignBlock';

describe('test VerticalAlignBlock', () => {
  test('should render correctly', () => {
    const onValueChange = jest.fn();
    const { baseElement, getByRole, getByText } = render(
      <VerticalAlignBlock onValueChange={onValueChange} value={VerticalAlign.BOTTOM} />,
    );

    expect(baseElement).toMatchSnapshot();

    fireEvent.mouseDown(getByRole('combobox'));
    expect(baseElement).toMatchSnapshot();

    fireEvent.click(getByText('Top Align'));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenNthCalledWith(1, VerticalAlign.TOP);
  });

  test('should render correctly with multiple values', () => {
    const onValueChange = jest.fn();
    const { baseElement } = render(
      <VerticalAlignBlock hasMultiValue onValueChange={onValueChange} value={VerticalAlign.BOTTOM} />,
    );

    expect(baseElement).toMatchSnapshot();
  });

  test('should render correctly in mobile', () => {
    useScreenStore.setState({ isMobile: true });

    const onValueChange = jest.fn();
    const { container, getByText } = render(
      <VerticalAlignBlock onValueChange={onValueChange} value={VerticalAlign.BOTTOM} />,
    );

    expect(container).toMatchSnapshot();
    fireEvent.click(getByText('Top Align'));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenNthCalledWith(1, VerticalAlign.TOP, {
      label: 'Top Align',
      value: VerticalAlign.TOP,
    });
  });

  test('should render correctly with multiple values in mobile', () => {
    useScreenStore.setState({ isMobile: true });

    const onValueChange = jest.fn();
    const { container } = render(
      <VerticalAlignBlock hasMultiValue onValueChange={onValueChange} value={VerticalAlign.BOTTOM} />,
    );

    expect(container).toMatchSnapshot();
  });
});
