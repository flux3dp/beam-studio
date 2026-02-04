// for mocking props
import React from 'react';

import { act, fireEvent, render } from '@testing-library/react';

import ColorPanel from './ColorPanel';

const mockSetIsColorPreviewing = jest.fn();

jest.mock('@core/app/contexts/CanvasContext', () => ({
  CanvasContext: React.createContext({
    isColorPreviewing: false,
    setIsColorPreviewing: (val) => mockSetIsColorPreviewing(val),
  }),
}));

jest.mock('@core/app/widgets/ColorPicker', () => ({ allowClear, initColor, onChange, triggerType }: any) => (
  <div>
    Mock ColorPicker
    <p>allowClear: {allowClear ? 't' : 'f'}</p>
    <p>initColor: {initColor}</p>
    <p>triggerType: {triggerType}</p>
    <button onClick={() => onChange('#aaaaff')} type="button">
      onChange
    </button>
  </div>
));

jest.mock('@core/app/widgets/ColorPickerMobile', () => ({ color, onChange, onClose, open }: any) => (
  <div>
    Mock ColorPicker Mobile
    <p>color: {color}</p>
    <p>open: {open ? 't' : 'f'}</p>
    <button onClick={() => onChange('#aaffff', false)} type="button">
      onPreview
    </button>
    <button
      onClick={() => {
        onChange('#aaaaff');
        onClose();
      }}
      type="button"
    >
      onChange
    </button>
    <button onClick={onClose} type="button">
      onClose
    </button>
  </div>
));

jest.mock('@core/app/widgets/FloatingPanel', () => ({ children, onClose, title }: any) => (
  <div>
    Mock Floating Panel
    <p>title: {title}</p>
    <button onClick={onClose} type="button">
      onClose
    </button>
    {children}
  </div>
));

jest.mock('@core/app/actions/beambox/constant', () => ({
  dpmm: 10,
}));

const mockCreateBatchCommand = jest.fn();

jest.mock('@core/app/svgedit/history/HistoryCommandFactory', () => ({
  createBatchCommand: (...args) => mockCreateBatchCommand(...args),
}));

const mockAddSubCommand = jest.fn();
const mockBatchCommand = {
  addSubCommand: (...args) => mockAddSubCommand(...args),
};

const mockDeleteElements = jest.fn();

jest.mock('@core/app/svgedit/operations/delete', () => ({
  deleteElements: (...args) => mockDeleteElements(...args),
}));

const mockSetMouseMode = jest.fn();

jest.mock('@core/app/stores/canvas/utils/mouseMode', () => ({
  setMouseMode: (...args) => mockSetMouseMode(...args),
}));

const mockChangeSelectedAttribute = jest.fn();
const mockChangeSelectedAttributeNoUndo = jest.fn();
const mockBeginUndoableChange = jest.fn();
const mockFinishUndoableChange = jest.fn();
const mockAddCommandToHistory = jest.fn();
const mockRequestSelector = jest.fn();

jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync: (callback) => {
    callback({
      Canvas: {
        changeSelectedAttribute: (...args) => mockChangeSelectedAttribute(...args),
        changeSelectedAttributeNoUndo: (...args) => mockChangeSelectedAttributeNoUndo(...args),
        selectorManager: {
          requestSelector: (...args) => mockRequestSelector(...args),
        },
        undoMgr: {
          addCommandToHistory: (...args) => mockAddCommandToHistory(...args),
          beginUndoableChange: (...args) => mockBeginUndoableChange(...args),
          finishUndoableChange: (...args) => mockFinishUndoableChange(...args),
        },
      },
    });
  },
}));

const mockUseIsMobile = jest.fn();

jest.mock('@core/helpers/system-helper', () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

const mockElem = {
  getAttribute: jest.fn(),
};

describe('test ColorPanel', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockElem.getAttribute.mockReturnValueOnce('#ff0000').mockReturnValueOnce('#00ff00').mockReturnValueOnce('1');
    mockCreateBatchCommand.mockReturnValue(mockBatchCommand);
  });

  it('should render correctly', () => {
    const { container } = render(<ColorPanel elem={mockElem as any} />);

    expect(container).toMatchSnapshot();
    expect(mockElem.getAttribute).toHaveBeenCalledTimes(3);
    expect(mockElem.getAttribute).toHaveBeenNthCalledWith(1, 'fill');
    expect(mockElem.getAttribute).toHaveBeenNthCalledWith(2, 'stroke');
    expect(mockElem.getAttribute).toHaveBeenNthCalledWith(3, 'stroke-width');
  });

  test('set stroke width should work', () => {
    const { container } = render(<ColorPanel elem={mockElem as any} />);
    const input = container.querySelector('#stroke-width');

    fireEvent.change(input, { target: { value: '2' } });
    expect(mockChangeSelectedAttribute).toHaveBeenCalledTimes(1);
    expect(mockChangeSelectedAttribute).toHaveBeenNthCalledWith(1, 'stroke-width', 20, [mockElem]);
    expect(container).toMatchSnapshot();
  });

  test('set fill color should work', () => {
    const { getAllByText } = render(<ColorPanel elem={mockElem as any} />);
    const mockCmd1 = { id: '1', isEmpty: () => false };
    const mockCmd2 = { id: '2', isEmpty: () => false };

    mockFinishUndoableChange.mockReturnValueOnce(mockCmd1).mockReturnValueOnce(mockCmd2);

    const changeFillBtn = getAllByText('onChange')[0];

    act(() => {
      fireEvent.click(changeFillBtn);
    });
    expect(mockCreateBatchCommand).toHaveBeenCalledTimes(1);
    expect(mockCreateBatchCommand).toHaveBeenNthCalledWith(1, 'Color Panel Fill');
    expect(mockBeginUndoableChange).toHaveBeenCalledTimes(2);
    expect(mockBeginUndoableChange).toHaveBeenNthCalledWith(1, 'fill', [mockElem]);
    expect(mockBeginUndoableChange).toHaveBeenNthCalledWith(2, 'fill-opacity', [mockElem]);
    expect(mockChangeSelectedAttributeNoUndo).toHaveBeenCalledTimes(2);
    expect(mockChangeSelectedAttributeNoUndo).toHaveBeenNthCalledWith(1, 'fill', '#aaaaff', [mockElem]);
    expect(mockChangeSelectedAttributeNoUndo).toHaveBeenNthCalledWith(2, 'fill-opacity', '1', [mockElem]);
    expect(mockFinishUndoableChange).toHaveBeenCalledTimes(2);
    expect(mockAddSubCommand).toHaveBeenCalledTimes(2);
    expect(mockAddSubCommand).toHaveBeenNthCalledWith(1, mockCmd1);
    expect(mockAddSubCommand).toHaveBeenNthCalledWith(2, mockCmd2);
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenNthCalledWith(1, mockBatchCommand);
  });

  test('set stroke color should work', () => {
    const { getAllByText } = render(<ColorPanel elem={mockElem as any} />);
    const mockCmd = { id: '1', isEmpty: () => false };

    mockFinishUndoableChange.mockReturnValueOnce(mockCmd);
    expect(mockChangeSelectedAttributeNoUndo).not.toHaveBeenCalled();

    const changeStrokeBtn = getAllByText('onChange')[1];

    act(() => {
      fireEvent.click(changeStrokeBtn);
    });
    expect(mockBeginUndoableChange).toHaveBeenCalledTimes(1);
    expect(mockBeginUndoableChange).toHaveBeenNthCalledWith(1, 'stroke', [mockElem]);
    expect(mockChangeSelectedAttributeNoUndo).toHaveBeenCalledTimes(1);
    expect(mockChangeSelectedAttributeNoUndo).toHaveBeenNthCalledWith(1, 'stroke', '#aaaaff', [mockElem]);
    expect(mockFinishUndoableChange).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenNthCalledWith(1, mockCmd);
  });
});

describe('test ColorPanel mobile', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockElem.getAttribute.mockReturnValueOnce('#ff0000').mockReturnValueOnce('#00ff00').mockReturnValueOnce('1');
    mockUseIsMobile.mockReturnValue(true);
    mockCreateBatchCommand.mockReturnValue(mockBatchCommand);
    mockRequestSelector.mockReturnValue({ resize: jest.fn() });
  });

  it('should render correctly', () => {
    const { container, getAllByText, getByText } = render(<ColorPanel elem={mockElem as any} />);

    expect(container).toMatchSnapshot();
    expect(mockElem.getAttribute).toHaveBeenCalledTimes(3);
    expect(mockElem.getAttribute).toHaveBeenNthCalledWith(1, 'fill');
    expect(mockElem.getAttribute).toHaveBeenNthCalledWith(2, 'stroke');
    expect(mockElem.getAttribute).toHaveBeenNthCalledWith(3, 'stroke-width');
    act(() => {
      fireEvent.click(getByText('Infill'));
    });
    expect(container).toMatchSnapshot();
    act(() => {
      fireEvent.click(container.querySelector('div.color.large>div'));
    });
    expect(container).toMatchSnapshot();
    act(() => {
      fireEvent.click(getAllByText('onClose')[0]);
      fireEvent.click(getByText('Stroke'));
    });
    expect(container).toMatchSnapshot();
  });

  test('set stroke width should work', () => {
    const { container, getByText } = render(<ColorPanel elem={mockElem as any} />);

    act(() => {
      fireEvent.click(getByText('Stroke'));
    });

    const input = container.querySelector('input');

    fireEvent.change(input, { target: { value: '2' } });
    expect(mockChangeSelectedAttribute).toHaveBeenCalledTimes(1);
    expect(mockChangeSelectedAttribute).toHaveBeenNthCalledWith(1, 'stroke-width', 20, [mockElem]);
  });

  test('set fill color should work', () => {
    const { container, getByText } = render(<ColorPanel elem={mockElem as any} />);
    const mockCmd1 = { id: '1', isEmpty: () => false };
    const mockCmd2 = { id: '2', isEmpty: () => false };

    mockFinishUndoableChange.mockReturnValueOnce(mockCmd1).mockReturnValue(mockCmd2);
    act(() => {
      fireEvent.click(getByText('Infill'));
    });
    act(() => {
      fireEvent.click(container.querySelector('div.color.large>div'));
    });
    expect(mockSetMouseMode).toHaveBeenCalledTimes(1);
    expect(mockSetMouseMode).toHaveBeenNthCalledWith(1, 'preview_color');
    act(() => {
      fireEvent.click(getByText('onPreview'));
    });
    expect(mockCreateBatchCommand).toHaveBeenCalledTimes(1);
    expect(mockCreateBatchCommand).toHaveBeenNthCalledWith(1, 'Color Panel Fill');
    expect(mockBeginUndoableChange).toHaveBeenCalledTimes(2);
    expect(mockBeginUndoableChange).toHaveBeenNthCalledWith(1, 'fill', [mockElem]);
    expect(mockBeginUndoableChange).toHaveBeenNthCalledWith(2, 'fill-opacity', [mockElem]);
    expect(mockChangeSelectedAttributeNoUndo).toHaveBeenCalledTimes(2);
    expect(mockChangeSelectedAttributeNoUndo).toHaveBeenNthCalledWith(1, 'fill', '#aaffff', [mockElem]);
    expect(mockChangeSelectedAttributeNoUndo).toHaveBeenNthCalledWith(2, 'fill-opacity', '1', [mockElem]);
    expect(mockFinishUndoableChange).toHaveBeenCalledTimes(2);
    expect(mockAddSubCommand).toHaveBeenCalledTimes(2);
    expect(mockAddSubCommand).toHaveBeenNthCalledWith(1, mockCmd1);
    expect(mockAddSubCommand).toHaveBeenNthCalledWith(2, mockCmd2);
    expect(mockAddCommandToHistory).not.toHaveBeenCalled();
    act(() => {
      fireEvent.click(getByText('onChange'));
    });
    expect(mockCreateBatchCommand).toHaveBeenCalledTimes(3);
    expect(mockCreateBatchCommand).toHaveBeenNthCalledWith(2, 'Color Panel Fill');
    expect(mockCreateBatchCommand).toHaveBeenNthCalledWith(3, 'Color Panel Fill');
    expect(mockBeginUndoableChange).toHaveBeenCalledTimes(6);
    expect(mockBeginUndoableChange).toHaveBeenNthCalledWith(3, 'fill', [mockElem]);
    expect(mockBeginUndoableChange).toHaveBeenNthCalledWith(4, 'fill-opacity', [mockElem]);
    expect(mockBeginUndoableChange).toHaveBeenNthCalledWith(5, 'fill', [mockElem]);
    expect(mockBeginUndoableChange).toHaveBeenNthCalledWith(6, 'fill-opacity', [mockElem]);
    expect(mockChangeSelectedAttributeNoUndo).toHaveBeenCalledTimes(6);
    expect(mockChangeSelectedAttributeNoUndo).toHaveBeenNthCalledWith(3, 'fill', '#ff0000', [mockElem]);
    expect(mockChangeSelectedAttributeNoUndo).toHaveBeenNthCalledWith(4, 'fill-opacity', '1', [mockElem]);
    expect(mockChangeSelectedAttributeNoUndo).toHaveBeenNthCalledWith(5, 'fill', '#aaaaff', [mockElem]);
    expect(mockChangeSelectedAttributeNoUndo).toHaveBeenNthCalledWith(6, 'fill-opacity', '1', [mockElem]);
    expect(mockFinishUndoableChange).toHaveBeenCalledTimes(6);
    expect(mockAddSubCommand).toHaveBeenCalledTimes(6);
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenNthCalledWith(1, mockBatchCommand);
    expect(mockSetMouseMode).toHaveBeenCalledTimes(2);
    expect(mockSetMouseMode).toHaveBeenNthCalledWith(2, 'select');
  });

  test('set stroke color should work', () => {
    const { container, getByText } = render(<ColorPanel elem={mockElem as any} />);
    const mockCmd = { id: '1', isEmpty: () => false };

    mockFinishUndoableChange.mockReturnValue(mockCmd);
    act(() => {
      fireEvent.click(getByText('Stroke'));
    });
    act(() => {
      fireEvent.click(container.querySelector('div.color.large>div'));
    });
    expect(mockSetMouseMode).toHaveBeenCalledTimes(1);
    expect(mockSetMouseMode).toHaveBeenNthCalledWith(1, 'preview_color');
    act(() => {
      fireEvent.click(getByText('onPreview'));
    });
    expect(mockBeginUndoableChange).toHaveBeenCalledTimes(1);
    expect(mockBeginUndoableChange).toHaveBeenNthCalledWith(1, 'stroke', [mockElem]);
    expect(mockChangeSelectedAttributeNoUndo).toHaveBeenCalledTimes(1);
    expect(mockChangeSelectedAttributeNoUndo).toHaveBeenNthCalledWith(1, 'stroke', '#aaffff', [mockElem]);
    expect(mockFinishUndoableChange).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).not.toHaveBeenCalled();
    act(() => {
      fireEvent.click(getByText('onChange'));
    });
    expect(mockBeginUndoableChange).toHaveBeenCalledTimes(3);
    expect(mockBeginUndoableChange).toHaveBeenNthCalledWith(2, 'stroke', [mockElem]);
    expect(mockBeginUndoableChange).toHaveBeenNthCalledWith(2, 'stroke', [mockElem]);
    expect(mockChangeSelectedAttributeNoUndo).toHaveBeenCalledTimes(3);
    expect(mockChangeSelectedAttributeNoUndo).toHaveBeenNthCalledWith(2, 'stroke', '#00ff00', [mockElem]);
    expect(mockChangeSelectedAttributeNoUndo).toHaveBeenNthCalledWith(3, 'stroke', '#aaaaff', [mockElem]);
    expect(mockFinishUndoableChange).toHaveBeenCalledTimes(3);
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenNthCalledWith(1, mockCmd);
    expect(mockSetMouseMode).toHaveBeenCalledTimes(2);
    expect(mockSetMouseMode).toHaveBeenNthCalledWith(2, 'select');
  });
});
