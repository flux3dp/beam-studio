import * as React from 'react';

import { fireEvent, render } from '@testing-library/react';

enum VerticalAlign {
  BOTTOM = 0,
  MIDDLE = 1,
  TOP = 2,
}

jest.mock('@core/app/actions/beambox/textPathEdit', () => ({ VerticalAlign }));

const useIsMobile = jest.fn();

jest.mock('@core/helpers/system-helper', () => ({
  useIsMobile: () => useIsMobile(),
}));

jest.mock('@core/app/views/beambox/Right-Panels/ObjectPanelItem');

// Mock store
const mockStore = {
  configs: {
    verticalAlign: { hasMultiValue: false, value: VerticalAlign.BOTTOM },
  },
  handleVerticalAlignChange: jest.fn(),
};

jest.mock('../../stores/useTextOptionsStore', () => ({
  useTextOptionsStore: () => mockStore,
}));

import VerticalAlignBlock from './VerticalAlignBlock';

describe('test VerticalAlignBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useIsMobile.mockReturnValue(false);
    mockStore.configs.verticalAlign = { hasMultiValue: false, value: VerticalAlign.BOTTOM };
  });

  test('should render correctly', () => {
    const { baseElement, getByRole, getByText } = render(<VerticalAlignBlock />);

    expect(baseElement).toMatchSnapshot();

    fireEvent.mouseDown(getByRole('combobox'));
    expect(baseElement).toMatchSnapshot();

    fireEvent.click(getByText('Top Align'));
    expect(mockStore.handleVerticalAlignChange).toHaveBeenCalledTimes(1);
    expect(mockStore.handleVerticalAlignChange).toHaveBeenNthCalledWith(1, VerticalAlign.TOP);
  });

  test('should render correctly with multiple values', () => {
    mockStore.configs.verticalAlign = { hasMultiValue: true, value: VerticalAlign.BOTTOM };

    const { baseElement } = render(<VerticalAlignBlock />);

    expect(baseElement).toMatchSnapshot();
  });

  test('should render correctly in mobile', () => {
    useIsMobile.mockReturnValue(true);

    const { container, getByText } = render(<VerticalAlignBlock />);

    expect(container).toMatchSnapshot();
    fireEvent.click(getByText('Top Align'));
    expect(mockStore.handleVerticalAlignChange).toHaveBeenCalledTimes(1);
    expect(mockStore.handleVerticalAlignChange).toHaveBeenNthCalledWith(1, VerticalAlign.TOP, {
      label: 'Top Align',
      value: VerticalAlign.TOP,
    });
  });

  test('should render correctly with multiple values in mobile', () => {
    useIsMobile.mockReturnValue(true);
    mockStore.configs.verticalAlign = { hasMultiValue: true, value: VerticalAlign.BOTTOM };

    const { container } = render(<VerticalAlignBlock />);

    expect(container).toMatchSnapshot();
  });
});
