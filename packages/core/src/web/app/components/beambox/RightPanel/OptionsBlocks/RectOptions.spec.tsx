import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { ObjectPanelContext } from '../contexts/ObjectPanelContext';

import RectOptions from './RectOptions';

const get = jest.fn();

jest.mock('@core/implementations/storage', () => ({
  get: (...args) => get(...args),
}));

const useIsMobile = jest.fn();

jest.mock('@core/helpers/system-helper', () => ({
  useIsMobile: () => useIsMobile(),
}));

const changeSelectedAttribute = jest.fn();

jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync: (callback) => {
    callback({
      Canvas: {
        changeSelectedAttribute: (...args) => changeSelectedAttribute(...args),
      },
    });
  },
}));

jest.mock('../ObjectPanelItem');

describe('should render correctly', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('unit is inches', () => {
    get.mockReturnValue('inches');

    const updateDimensionValues = jest.fn();
    const { container } = render(
      <ObjectPanelContext.Provider value={{ dimensionValues: { rx: 0 }, updateDimensionValues } as any}>
        <RectOptions elem={document.getElementById('flux')} />
      </ObjectPanelContext.Provider>,
    );

    expect(container).toMatchSnapshot();
    fireEvent.change(container.querySelector('input'), { target: { value: 1 } });
    fireEvent.blur(container.querySelector('input'));

    expect(changeSelectedAttribute).toHaveBeenCalledTimes(1);
    expect(changeSelectedAttribute).toHaveBeenNthCalledWith(1, 'rx', 254, [document.getElementById('flux')]);
    expect(updateDimensionValues).toHaveBeenCalledTimes(1);
    expect(updateDimensionValues).toHaveBeenNthCalledWith(1, { rx: 254 });
  });

  test('unit is not inches', () => {
    get.mockReturnValue(null);

    const { container } = render(
      <ObjectPanelContext.Provider value={{ dimensionValues: { rx: 10 }, updateDimensionValues: jest.fn() } as any}>
        <RectOptions elem={document.getElementById('flux')} />
      </ObjectPanelContext.Provider>,
    );

    expect(container).toMatchSnapshot();
  });
});

describe('should render correctly in mobile', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('unit is not inches', () => {
    useIsMobile.mockReturnValue(true);
    get.mockReturnValue(null);

    const updateDimensionValues = jest.fn();
    const { container } = render(
      <ObjectPanelContext.Provider value={{ dimensionValues: { rx: 10 }, updateDimensionValues } as any}>
        <RectOptions elem={document.getElementById('flux')} />
      </ObjectPanelContext.Provider>,
    );

    expect(container).toMatchSnapshot();
    fireEvent.change(container.querySelector('input'), { target: { value: 2 } });
    expect(changeSelectedAttribute).toHaveBeenCalledTimes(1);
    expect(changeSelectedAttribute).toHaveBeenNthCalledWith(1, 'rx', 20, [document.getElementById('flux')]);
    expect(updateDimensionValues).toHaveBeenCalledTimes(1);
    expect(updateDimensionValues).toHaveBeenNthCalledWith(1, { rx: 20 });
  });
});
