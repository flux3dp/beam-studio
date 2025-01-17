import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import { ObjectPanelContextProvider } from 'app/views/beambox/Right-Panels/contexts/ObjectPanelContext';

import PolygonOptions from './PolygonOptions';

const useIsMobile = jest.fn();
jest.mock('helpers/system-helper', () => ({
  useIsMobile: () => useIsMobile(),
}));

jest.mock('helpers/useI18n', () => () => ({
  beambox: {
    right_panel: {
      object_panel: {
        option_panel: {
          sides: 'Sides',
        },
      },
    },
  },
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
jest.mock('app/svgedit/history/HistoryCommandFactory', () => ({
  createBatchCommand: (...args) => mockCreateBatchCommand(...args),
}));

const mockBeginUndoableChange = jest.fn();
const mockFinishUndoableChange = jest.fn();
const mockAddCommandToHistory = jest.fn();
jest.mock('helpers/svg-editor-helper', () => ({
  getSVGAsync: (cb) => {
    cb({
      Canvas: {
        undoMgr: {
          beginUndoableChange: (...args) => mockBeginUndoableChange(...args),
          finishUndoableChange: (...args) => mockFinishUndoableChange(...args),
          addCommandToHistory: (...args) => mockAddCommandToHistory(...args),
        },
      },
    });
  },
}));


describe('test PolygonOptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.updatePolygonSides = mockUpdatePolygonSides;
    mockCreateBatchCommand.mockReturnValue(mockBatchCmd);
    mockFinishUndoableChange.mockReturnValue(mockBatchCmd);
  });

  test('should render correctly', () => {
    const { container, rerender } = render(
      <PolygonOptions elem={document.getElementById('flux')} polygonSides={0} />
    );
    expect(container).toMatchSnapshot();

    const elem = document.createElement('polygon');
    elem.setAttribute('id', 'flux');
    elem.setAttribute('sides', '5');
    document.body.appendChild(elem);
    rerender(<PolygonOptions elem={document.getElementById('flux')} polygonSides={5} />);

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
    const { baseElement, container, getByText, rerender } = render(
      <PolygonOptions elem={document.getElementById('flux')} polygonSides={0} />
    );
    expect(container).toMatchSnapshot();

    const elem = document.createElement('polygon');
    elem.setAttribute('id', 'flux');
    elem.setAttribute('sides', '5');
    document.body.appendChild(elem);
    rerender(
      <ObjectPanelContextProvider>
        <PolygonOptions elem={document.getElementById('flux')} polygonSides={5} />
      </ObjectPanelContextProvider>
    );
    expect(container).toMatchSnapshot();

    const objectPanelItem = baseElement.querySelector('div.object-panel-item');
    const displayBtn = baseElement.querySelector('button.number-item');
    expect(displayBtn).toHaveTextContent('5');
    expect(objectPanelItem).not.toHaveClass('active');
    fireEvent.click(objectPanelItem);
    expect(objectPanelItem).toHaveClass('active');
    expect(getByText('.').parentElement).toHaveClass('adm-button-disabled');
    expect(mockUpdatePolygonSides).not.toHaveBeenCalled();
    fireEvent.click(baseElement.querySelectorAll('.input-keys button')[2]);

    expect(mockUpdatePolygonSides).toHaveBeenCalledTimes(1);
    expect(mockUpdatePolygonSides).toHaveBeenLastCalledWith(expect.anything(), -2);
    expect(expect(displayBtn).toHaveTextContent('3'));
  });
});
