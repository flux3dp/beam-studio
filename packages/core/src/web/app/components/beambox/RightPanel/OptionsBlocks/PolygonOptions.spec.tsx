import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { ObjectPanelContext } from '../contexts/ObjectPanelContext';

import PolygonOptions from './PolygonOptions';

const useIsMobile = jest.fn();

jest.mock('@core/helpers/system-helper', () => ({
  useIsMobile: () => useIsMobile(),
}));

const mockUpdatePolygonSides = jest.fn((elem, val) => {
  const sides = +elem.getAttribute('sides');

  elem.setAttribute('sides', (sides + val).toString());
});

const mockCreateBatchCommand = jest.fn();
const mockBatchCmd = {
  addSubCommand: jest.fn(),
  isEmpty: jest.fn(),
};

jest.mock('@core/app/svgedit/history/HistoryCommandFactory', () => ({
  createBatchCommand: (...args) => mockCreateBatchCommand(...args),
}));

const mockBeginUndoableChange = jest.fn();
const mockFinishUndoableChange = jest.fn();
const mockAddCommandToHistory = jest.fn();

jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync: (cb) => {
    cb({
      Canvas: {
        undoMgr: {
          addCommandToHistory: (...args) => mockAddCommandToHistory(...args),
          beginUndoableChange: (...args) => mockBeginUndoableChange(...args),
          finishUndoableChange: (...args) => mockFinishUndoableChange(...args),
        },
      },
    });
  },
}));

jest.mock('../ObjectPanelItem');

describe('test PolygonOptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.updatePolygonSides = mockUpdatePolygonSides;
    mockCreateBatchCommand.mockReturnValue(mockBatchCmd);
    mockFinishUndoableChange.mockReturnValue(mockBatchCmd);
  });

  test('should render correctly', () => {
    const { container, rerender } = render(
      <ObjectPanelContext.Provider value={{ polygonSides: 0 } as any}>
        <PolygonOptions elem={document.getElementById('flux')} />
      </ObjectPanelContext.Provider>,
    );

    expect(container).toMatchSnapshot();

    const elem = document.createElement('polygon');

    elem.setAttribute('id', 'flux');
    elem.setAttribute('sides', '5');
    document.body.appendChild(elem);
    rerender(
      <ObjectPanelContext.Provider value={{ polygonSides: 5 } as any}>
        <PolygonOptions elem={document.getElementById('flux')} />
      </ObjectPanelContext.Provider>,
    );

    expect(container).toMatchSnapshot();

    const input = container.querySelector('input');

    fireEvent.change(input, { target: { value: 8 } });
    fireEvent.blur(input);

    expect(container).toMatchSnapshot();
    expect(mockCreateBatchCommand).toBeCalledTimes(1);
    expect(mockCreateBatchCommand).toHaveBeenNthCalledWith(1, 'Change Polygon Sides');
    expect(mockUpdatePolygonSides).toHaveBeenCalledTimes(1);
    expect(mockUpdatePolygonSides).toHaveBeenCalledWith(elem, 3);
    expect(mockBeginUndoableChange).toBeCalledTimes(2);
    expect(mockBeginUndoableChange).toHaveBeenNthCalledWith(1, 'sides', [elem]);
    expect(mockBeginUndoableChange).toHaveBeenNthCalledWith(2, 'points', [elem]);
    expect(mockFinishUndoableChange).toBeCalledTimes(2);
    expect(mockBatchCmd.isEmpty).toBeCalledTimes(3);
    expect(mockBatchCmd.addSubCommand).toBeCalledTimes(2);
    expect(mockAddCommandToHistory).toBeCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenNthCalledWith(1, mockBatchCmd);

    jest.clearAllMocks();

    fireEvent.change(input, { target: { value: 5 } });
    fireEvent.blur(input);
    expect(container).toMatchSnapshot();
    expect(mockUpdatePolygonSides).toHaveBeenCalledTimes(1);
    expect(mockUpdatePolygonSides).toHaveBeenCalledWith(elem, -3);

    jest.clearAllMocks();

    fireEvent.change(input, { target: { value: 5 } });
    fireEvent.blur(input);
    expect(mockUpdatePolygonSides).not.toHaveBeenCalled();
    expect(mockBeginUndoableChange).not.toBeCalled();
    expect(mockFinishUndoableChange).not.toBeCalled();
    expect(mockBatchCmd.isEmpty).not.toBeCalled();
    expect(mockBatchCmd.addSubCommand).not.toBeCalled();
    expect(mockAddCommandToHistory).not.toBeCalled();
  });

  test('should render correctly in mobile', async () => {
    useIsMobile.mockReturnValue(true);

    const { container, rerender } = render(
      <ObjectPanelContext.Provider value={{ polygonSides: 0 } as any}>
        <PolygonOptions elem={document.getElementById('flux')} />
      </ObjectPanelContext.Provider>,
    );

    expect(container).toMatchSnapshot();

    const elem = document.createElement('polygon');

    elem.setAttribute('id', 'flux');
    elem.setAttribute('sides', '5');
    document.body.appendChild(elem);
    rerender(
      <ObjectPanelContext.Provider value={{ polygonSides: 5 } as any}>
        <PolygonOptions elem={document.getElementById('flux')} />
      </ObjectPanelContext.Provider>,
    );
    expect(container).toMatchSnapshot();

    expect(mockUpdatePolygonSides).not.toHaveBeenCalled();
    fireEvent.change(container.querySelector('input'), { target: { value: 3 } });

    expect(mockUpdatePolygonSides).toHaveBeenCalledTimes(1);
    expect(mockUpdatePolygonSides).toHaveBeenLastCalledWith(expect.anything(), -2);
  });
});
