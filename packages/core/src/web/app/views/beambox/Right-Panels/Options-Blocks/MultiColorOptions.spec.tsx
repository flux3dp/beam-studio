import React from 'react';

import { act, fireEvent, render } from '@testing-library/react';

import { CanvasContext } from '@core/app/contexts/CanvasContext';

import MultiColorOptions from './MultiColorOptions';

jest.mock('@core/app/contexts/CanvasContext', () => ({
  CanvasContext: React.createContext({ isColorPreviewing: false }),
}));

jest.mock('@core/app/widgets/ColorPicker', () => ({ allowClear, initColor, onChange, triggerType }: any) => (
  <div>
    Mock ColorPicker
    <p>allowClear: {allowClear ? 't' : 'f'}</p>
    <p>initColor: {initColor}</p>
    <p>triggerType: {triggerType}</p>
    <button onClick={() => onChange('#AAAAFF')} type="button">
      onChange
    </button>
  </div>
));

jest.mock('@core/app/widgets/ColorPickerMobile', () => ({ color, onChange, onClose, open }: any) => (
  <div>
    Mock ColorPicker Mobile
    <p>color: {color}</p>
    <p>open: {open ? 't' : 'f'}</p>
    <button onClick={() => onChange('#FFFFFF', false)} type="button">
      onPreview
    </button>
    <button
      onClick={() => {
        onChange('#AAAAFF');
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

const mockColloectColors = jest.fn();

jest.mock(
  '@core/helpers/color/collectColors',
  () =>
    (...args) =>
      mockColloectColors(...args),
);

const mockCreateBatchCommand = jest.fn();

jest.mock('@core/app/svgedit/history/HistoryCommandFactory', () => ({
  createBatchCommand: (...args) => mockCreateBatchCommand(...args),
}));

const mockAddSubCommand = jest.fn();
const mockBatchCommand = {
  addSubCommand: (...args) => mockAddSubCommand(...args),
  isEmpty: () => false,
};

const mockReRenderImageSymbolArray = jest.fn();

jest.mock('@core/helpers/symbol-helper/symbolMaker', () => ({
  reRenderImageSymbolArray: (...args) => mockReRenderImageSymbolArray(...args),
}));

const mockSetMouseMode = jest.fn();

jest.mock('@core/app/stores/canvas/utils/mouseMode', () => ({
  setMouseMode: (...args) => mockSetMouseMode(...args),
}));

const mockChangeSelectedAttributeNoUndo = jest.fn();
const mockBeginUndoableChange = jest.fn();
const mockFinishUndoableChange = jest.fn();
const mockAddCommandToHistory = jest.fn();
const mockResize = jest.fn();

jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync: (callback) => {
    callback({
      Canvas: {
        changeSelectedAttributeNoUndo: (...args) => mockChangeSelectedAttributeNoUndo(...args),
        selectorManager: {
          requestSelector: () => ({ resize: (...args) => mockResize(...args) }),
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

jest.mock('@core/app/widgets/HorizontalScrollContainer', () => ({ children, className }: any) => (
  <div className={className}>{children}</div>
));

const mockUseIsMobile = jest.fn();

jest.mock('@core/helpers/system-helper', () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

jest.mock('@core/helpers/useI18n', () => () => ({
  beambox: {
    right_panel: {
      object_panel: {
        option_panel: {
          color: 'Color',
        },
      },
    },
  },
}));

const mockUseElem = document.createElement('use');
const mockSetIsColorPreviewing = jest.fn();

describe('test MultiColorOptions', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockColloectColors.mockReturnValue({
      '#AAFFFF': [{ attribute: 'fill', element: '1', useElement: mockUseElem }],
      '#FFAAFF': [
        { attribute: 'fill', element: '2', useElement: mockUseElem },
        { attribute: 'stroke', element: '3', useElement: mockUseElem },
      ],
    });
    mockCreateBatchCommand.mockReturnValue(mockBatchCommand);
  });

  it('should render correctly', () => {
    const { container } = render(
      <CanvasContext.Provider value={{ isColorPreviewing: false } as any}>
        <MultiColorOptions elem={document.createElement('rect')} />
      </CanvasContext.Provider>,
    );

    expect(container).toMatchSnapshot();
  });

  test('editing color in use element should work', async () => {
    const { getAllByText, getByText } = render(
      <CanvasContext.Provider value={{ isColorPreviewing: false } as any}>
        <MultiColorOptions elem={mockUseElem} />
      </CanvasContext.Provider>,
    );
    const mockChangeCmd = { isEmpty: () => false };

    mockColloectColors.mockReturnValue({
      '#AAAAFF': [
        { attribute: 'fill', element: '2', useElement: mockUseElem },
        { attribute: 'stroke', element: '3', useElement: mockUseElem },
      ],
      '#AAFFFF': [{ attribute: 'fill', element: '1', useElement: mockUseElem }],
    });
    mockFinishUndoableChange.mockReturnValue(mockChangeCmd);
    await act(async () => {
      fireEvent.click(getAllByText('onChange')[1]);
    });
    expect(mockCreateBatchCommand).toHaveBeenCalledTimes(1);
    expect(mockCreateBatchCommand).toHaveBeenLastCalledWith('Update Color');
    expect(mockBeginUndoableChange).toHaveBeenCalledTimes(2);
    expect(mockBeginUndoableChange).toHaveBeenNthCalledWith(1, 'fill', ['2']);
    expect(mockBeginUndoableChange).toHaveBeenNthCalledWith(2, 'stroke', ['3']);
    expect(mockChangeSelectedAttributeNoUndo).toHaveBeenCalledTimes(2);
    expect(mockChangeSelectedAttributeNoUndo).toHaveBeenNthCalledWith(1, 'fill', '#AAAAFF', ['2']);
    expect(mockChangeSelectedAttributeNoUndo).toHaveBeenNthCalledWith(2, 'stroke', '#AAAAFF', ['3']);
    expect(mockFinishUndoableChange).toHaveBeenCalledTimes(2);
    expect(mockAddSubCommand).toHaveBeenCalledTimes(2);
    expect(mockAddSubCommand).toHaveBeenNthCalledWith(1, mockChangeCmd);
    expect(mockAddSubCommand).toHaveBeenNthCalledWith(2, mockChangeCmd);
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenLastCalledWith(mockBatchCommand);
    expect(mockReRenderImageSymbolArray).toHaveBeenCalledTimes(1);
    expect(mockReRenderImageSymbolArray).toHaveBeenLastCalledWith(expect.anything(), {
      force: true,
    });
    expect(getByText('initColor: #AAAAFF')).toMatchSnapshot();
  });
});

describe('test MultiColorOptions mobile', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockUseIsMobile.mockReturnValue(true);
    mockColloectColors.mockReturnValue({
      '#AAFFFF': [{ attribute: 'fill', element: '1', useElement: mockUseElem }],
      '#FFAAFF': [
        { attribute: 'fill', element: '2', useElement: mockUseElem },
        { attribute: 'stroke', element: '3', useElement: mockUseElem },
      ],
    });
    mockCreateBatchCommand.mockReturnValue(mockBatchCommand);
  });

  it('should render correctly', () => {
    const { container, getByText } = render(
      <CanvasContext.Provider
        value={{ isColorPreviewing: false, setIsColorPreviewing: mockSetIsColorPreviewing } as any}
      >
        <MultiColorOptions elem={document.createElement('rect')} />
      </CanvasContext.Provider>,
    );

    act(() => {
      fireEvent.click(getByText('Color'));
    });
    act(() => {
      fireEvent.click(container.querySelector('div.color.large>div'));
    });
    expect(container).toMatchSnapshot();
  });

  test('editing color in use element should work', async () => {
    const { container, getByText } = render(
      <CanvasContext.Provider
        value={{ isColorPreviewing: false, setIsColorPreviewing: mockSetIsColorPreviewing } as any}
      >
        <MultiColorOptions elem={mockUseElem} />
      </CanvasContext.Provider>,
    );
    const mockChangeCmd = { isEmpty: () => false };

    mockFinishUndoableChange.mockReturnValue(mockChangeCmd);
    act(() => {
      fireEvent.click(getByText('Color'));
    });
    act(() => {
      fireEvent.click(container.querySelectorAll('div.color.large>div')[1]);
    });
    expect(mockSetMouseMode).toHaveBeenCalledTimes(1);
    expect(mockSetMouseMode).toHaveBeenNthCalledWith(1, 'preview_color');
    act(() => {
      fireEvent.click(getByText('onPreview'));
    });
    expect(mockCreateBatchCommand).toHaveBeenCalledTimes(1);
    expect(mockCreateBatchCommand).toHaveBeenLastCalledWith('Update Color');
    expect(mockBeginUndoableChange).toHaveBeenCalledTimes(2);
    expect(mockBeginUndoableChange).toHaveBeenNthCalledWith(1, 'fill', ['2']);
    expect(mockBeginUndoableChange).toHaveBeenNthCalledWith(2, 'stroke', ['3']);
    expect(mockChangeSelectedAttributeNoUndo).toHaveBeenCalledTimes(2);
    expect(mockChangeSelectedAttributeNoUndo).toHaveBeenNthCalledWith(1, 'fill', '#FFFFFF', ['2']);
    expect(mockChangeSelectedAttributeNoUndo).toHaveBeenNthCalledWith(2, 'stroke', '#FFFFFF', ['3']);
    expect(mockFinishUndoableChange).toHaveBeenCalledTimes(2);
    expect(mockAddSubCommand).toHaveBeenCalledTimes(2);
    expect(mockAddSubCommand).toHaveBeenNthCalledWith(1, mockChangeCmd);
    expect(mockAddSubCommand).toHaveBeenNthCalledWith(2, mockChangeCmd);
    expect(mockAddCommandToHistory).not.toBeCalled();
    expect(mockReRenderImageSymbolArray).toHaveBeenCalledTimes(1);
    expect(mockReRenderImageSymbolArray).toHaveBeenLastCalledWith(expect.anything(), {
      force: true,
    });
    act(() => {
      fireEvent.click(getByText('onChange'));
    });
    expect(mockCreateBatchCommand).toHaveBeenCalledTimes(3);
    expect(mockBeginUndoableChange).toHaveBeenCalledTimes(6);
    expect(mockBeginUndoableChange).toHaveBeenNthCalledWith(3, 'fill', ['2']);
    expect(mockBeginUndoableChange).toHaveBeenNthCalledWith(4, 'stroke', ['3']);
    expect(mockBeginUndoableChange).toHaveBeenNthCalledWith(5, 'fill', ['2']);
    expect(mockBeginUndoableChange).toHaveBeenNthCalledWith(6, 'stroke', ['3']);
    expect(mockChangeSelectedAttributeNoUndo).toHaveBeenCalledTimes(6);
    expect(mockChangeSelectedAttributeNoUndo).toHaveBeenNthCalledWith(3, 'fill', '#FFAAFF', ['2']);
    expect(mockChangeSelectedAttributeNoUndo).toHaveBeenNthCalledWith(4, 'stroke', '#FFAAFF', ['3']);
    expect(mockChangeSelectedAttributeNoUndo).toHaveBeenNthCalledWith(5, 'fill', '#AAAAFF', ['2']);
    expect(mockChangeSelectedAttributeNoUndo).toHaveBeenNthCalledWith(6, 'stroke', '#AAAAFF', ['3']);
    expect(mockFinishUndoableChange).toHaveBeenCalledTimes(6);
    expect(mockAddSubCommand).toHaveBeenCalledTimes(6);
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenLastCalledWith(mockBatchCommand);
    expect(mockReRenderImageSymbolArray).toHaveBeenCalledTimes(2);
    expect(mockReRenderImageSymbolArray).toHaveBeenLastCalledWith(expect.anything(), {
      force: true,
    });
  });
});
