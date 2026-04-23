import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { useScreenStore } from '@core/app/stores/screenStore';
import { ObjectPanelContext } from '../contexts/ObjectPanelContext';

const mockUpdatePolygonSides = jest.fn((elem, val) => {
  const sides = +elem.getAttribute('sides');

  elem.setAttribute('sides', (sides + val).toString());
});

jest.mock('@core/app/svgedit/polygon', () => ({
  updatePolygonSides: mockUpdatePolygonSides,
}));

const mockCreateBatchCommand = jest.fn();
const mockBatchCmd = {
  addSubCommand: jest.fn(),
  isEmpty: jest.fn(),
};

jest.mock('@core/app/svgedit/history/HistoryCommandFactory', () => ({
  createBatchCommand: (...args) => mockCreateBatchCommand(...args),
}));

const mockAddCommandToHistory = jest.fn();

jest.mock('@core/app/svgedit/history/undoManager', () => ({
  addCommandToHistory: (...args) => mockAddCommandToHistory(...args),
}));

jest.mock('../ObjectPanelItem');

import PolygonOptions from './PolygonOptions';

describe('test PolygonOptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateBatchCommand.mockReturnValue(mockBatchCmd);
  });

  test('should render correctly', () => {
    const { container, rerender } = render(
      <ObjectPanelContext value={{ polygonSides: 0 } as any}>
        <PolygonOptions elem={document.getElementById('flux')!} />
      </ObjectPanelContext>,
    );

    expect(container).toMatchSnapshot();

    const elem = document.createElement('polygon');

    elem.setAttribute('id', 'flux');
    elem.setAttribute('sides', '5');
    document.body.appendChild(elem);
    rerender(
      <ObjectPanelContext value={{ polygonSides: 5 } as any}>
        <PolygonOptions elem={document.getElementById('flux')!} />
      </ObjectPanelContext>,
    );

    expect(container).toMatchSnapshot();

    const input = container.querySelector('input')!;

    fireEvent.change(input, { target: { value: 8 } });
    fireEvent.blur(input);

    expect(container).toMatchSnapshot();
    expect(mockCreateBatchCommand).toHaveBeenCalledTimes(1);
    expect(mockCreateBatchCommand).toHaveBeenNthCalledWith(1, 'Change Polygon Sides');
    expect(mockUpdatePolygonSides).toHaveBeenCalledTimes(1);
    expect(mockUpdatePolygonSides).toHaveBeenCalledWith(elem, 3, { parentCmd: mockBatchCmd });
    expect(mockBatchCmd.isEmpty).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenNthCalledWith(1, mockBatchCmd);

    jest.clearAllMocks();

    fireEvent.change(input, { target: { value: 5 } });
    fireEvent.blur(input);
    expect(container).toMatchSnapshot();
    expect(mockUpdatePolygonSides).toHaveBeenCalledTimes(1);
    expect(mockUpdatePolygonSides).toHaveBeenCalledWith(elem, -3, { parentCmd: mockBatchCmd });

    jest.clearAllMocks();

    fireEvent.change(input, { target: { value: 5 } });
    fireEvent.blur(input);
    expect(mockUpdatePolygonSides).not.toHaveBeenCalled();
    expect(mockBatchCmd.isEmpty).not.toHaveBeenCalled();
    expect(mockBatchCmd.addSubCommand).not.toHaveBeenCalled();
    expect(mockAddCommandToHistory).not.toHaveBeenCalled();
  });

  test('should render correctly in mobile', async () => {
    useScreenStore.setState({ isMobile: true });

    const { container, rerender } = render(
      <ObjectPanelContext value={{ polygonSides: 0 } as any}>
        <PolygonOptions elem={document.getElementById('flux')!} />
      </ObjectPanelContext>,
    );

    expect(container).toMatchSnapshot();

    const elem = document.createElement('polygon');

    elem.setAttribute('id', 'flux');
    elem.setAttribute('sides', '5');
    document.body.appendChild(elem);
    rerender(
      <ObjectPanelContext value={{ polygonSides: 5 } as any}>
        <PolygonOptions elem={document.getElementById('flux')!} />
      </ObjectPanelContext>,
    );
    expect(container).toMatchSnapshot();

    expect(mockUpdatePolygonSides).not.toHaveBeenCalled();
    fireEvent.change(container.querySelector('input')!, { target: { value: 3 } });

    expect(mockUpdatePolygonSides).toHaveBeenCalledTimes(1);
    expect(mockUpdatePolygonSides).toHaveBeenLastCalledWith(expect.anything(), -2, { parentCmd: mockBatchCmd });
  });
});
