import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';

import { CanvasContext } from 'app/contexts/CanvasContext';

import MultiColorOptions from './MultiColorOptions';

jest.mock('app/contexts/CanvasContext', () => ({
  CanvasContext: React.createContext({ isColorPreviewing: false }),
}));

jest.mock(
  'app/widgets/ColorPicker',
  () =>
    ({ allowClear, initColor, triggerType, onChange }: any) =>
      (
        <div>
          Mock ColorPicker
          <p>allowClear: {allowClear ? 't' : 'f'}</p>
          <p>initColor: {initColor}</p>
          <p>triggerType: {triggerType}</p>
          <button type="button" onClick={() => onChange('#AAAAFF')}>
            onChange
          </button>
        </div>
      )
);

jest.mock('app/widgets/ColorPickerMobile', () => ({ color, onChange, open, onClose }: any) => (
  <div>
    Mock ColorPicker Mobile
    <p>color: {color}</p>
    <p>open: {open ? 't' : 'f'}</p>
    <button type="button" onClick={() => onChange('#FFFFFF', false)}>
      onPreview
    </button>
    <button
      type="button"
      onClick={() => {
        onChange('#AAAAFF');
        onClose();
      }}
    >
      onChange
    </button>
    <button type="button" onClick={onClose}>
      onClose
    </button>
  </div>
));

jest.mock('app/widgets/FloatingPanel', () => ({ title, children, onClose }: any) => (
  <div>
    Mock Floating Panel
    <p>title: {title}</p>
    <button type="button" onClick={onClose}>
      onClose
    </button>
    {children}
  </div>
));

const mockColloectColors = jest.fn();
jest.mock(
  'helpers/color/collectColors',
  () =>
    (...args) =>
      mockColloectColors(...args)
);

const mockCreateBatchCommand = jest.fn();
jest.mock('app/svgedit/history/HistoryCommandFactory', () => ({
  createBatchCommand: (...args) => mockCreateBatchCommand(...args),
}));

const mockAddSubCommand = jest.fn();
const mockBatchCommand = {
  addSubCommand: (...args) => mockAddSubCommand(...args),
  isEmpty: () => false,
};

const mockReRenderImageSymbolArray = jest.fn();
jest.mock('helpers/symbol-maker', () => ({
  reRenderImageSymbolArray: (...args) => mockReRenderImageSymbolArray(...args),
}));

const mockChangeSelectedAttributeNoUndo = jest.fn();
const mockBeginUndoableChange = jest.fn();
const mockFinishUndoableChange = jest.fn();
const mockAddCommandToHistory = jest.fn();
const mockSetCurrentMode = jest.fn();
const mockResize = jest.fn();
jest.mock('helpers/svg-editor-helper', () => ({
  getSVGAsync: (callback) => {
    callback({
      Canvas: {
        changeSelectedAttributeNoUndo: (...args) => mockChangeSelectedAttributeNoUndo(...args),
        undoMgr: {
          beginUndoableChange: (...args) => mockBeginUndoableChange(...args),
          finishUndoableChange: (...args) => mockFinishUndoableChange(...args),
          addCommandToHistory: (...args) => mockAddCommandToHistory(...args),
        },
        unsafeAccess: {
          setCurrentMode: (...args) => mockSetCurrentMode(...args),
        },
        selectorManager: {
          requestSelector: () => ({ resize: (...args) => mockResize(...args) }),
        },
      },
    });
  },
}));

jest.mock('app/widgets/HorizontalScrollContainer', () => ({ className, children }: any) => (
  <div className={className}>{children}</div>
));

const mockUseIsMobile = jest.fn();
jest.mock('helpers/system-helper', () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

jest.mock('helpers/useI18n', () => () => ({
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
      '#AAFFFF': [{ element: '1', attribute: 'fill', useElement: mockUseElem }],
      '#FFAAFF': [
        { element: '2', attribute: 'fill', useElement: mockUseElem },
        { element: '3', attribute: 'stroke', useElement: mockUseElem },
      ],
    });
    mockCreateBatchCommand.mockReturnValue(mockBatchCommand);
  });

  it('should render correctly', () => {
    const { container } = render(
      <CanvasContext.Provider value={{ isColorPreviewing: false } as any}>
        <MultiColorOptions elem={document.createElement('rect')} />
      </CanvasContext.Provider>
    );
    expect(container).toMatchSnapshot();
  });

  test('editing color in use element should work', async () => {
    const { getByText, getAllByText } = render(
      <CanvasContext.Provider value={{ isColorPreviewing: false } as any}>
        <MultiColorOptions elem={mockUseElem} />
      </CanvasContext.Provider>
    );
    const mockChangeCmd = { isEmpty: () => false };
    mockColloectColors.mockReturnValue({
      '#AAFFFF': [{ element: '1', attribute: 'fill', useElement: mockUseElem }],
      '#AAAAFF': [
        { element: '2', attribute: 'fill', useElement: mockUseElem },
        { element: '3', attribute: 'stroke', useElement: mockUseElem },
      ],
    });
    mockFinishUndoableChange.mockReturnValue(mockChangeCmd);
    await act(async () => {
      fireEvent.click(getAllByText('onChange')[1]);
    });
    expect(mockCreateBatchCommand).toBeCalledTimes(1);
    expect(mockCreateBatchCommand).toHaveBeenLastCalledWith('Update Color');
    expect(mockBeginUndoableChange).toBeCalledTimes(2);
    expect(mockBeginUndoableChange).toHaveBeenNthCalledWith(1, 'fill', ['2']);
    expect(mockBeginUndoableChange).toHaveBeenNthCalledWith(2, 'stroke', ['3']);
    expect(mockChangeSelectedAttributeNoUndo).toHaveBeenCalledTimes(2);
    expect(mockChangeSelectedAttributeNoUndo).toHaveBeenNthCalledWith(1, 'fill', '#AAAAFF', ['2']);
    expect(mockChangeSelectedAttributeNoUndo).toHaveBeenNthCalledWith(2, 'stroke', '#AAAAFF', [
      '3',
    ]);
    expect(mockFinishUndoableChange).toHaveBeenCalledTimes(2);
    expect(mockAddSubCommand).toBeCalledTimes(2);
    expect(mockAddSubCommand).toHaveBeenNthCalledWith(1, mockChangeCmd);
    expect(mockAddSubCommand).toHaveBeenNthCalledWith(2, mockChangeCmd);
    expect(mockAddCommandToHistory).toBeCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenLastCalledWith(mockBatchCommand);
    expect(mockReRenderImageSymbolArray).toBeCalledTimes(1);
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
      '#AAFFFF': [{ element: '1', attribute: 'fill', useElement: mockUseElem }],
      '#FFAAFF': [
        { element: '2', attribute: 'fill', useElement: mockUseElem },
        { element: '3', attribute: 'stroke', useElement: mockUseElem },
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
      </CanvasContext.Provider>
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
      </CanvasContext.Provider>
    );
    const mockChangeCmd = { isEmpty: () => false };
    mockFinishUndoableChange.mockReturnValue(mockChangeCmd);
    act(() => {
      fireEvent.click(getByText('Color'));
    });
    act(() => {
      fireEvent.click(container.querySelectorAll('div.color.large>div')[1]);
    });
    expect(mockSetCurrentMode).toBeCalledTimes(1);
    expect(mockSetCurrentMode).toHaveBeenNthCalledWith(1, 'preview_color');
    act(() => {
      fireEvent.click(getByText('onPreview'));
    });
    expect(mockCreateBatchCommand).toBeCalledTimes(1);
    expect(mockCreateBatchCommand).toHaveBeenLastCalledWith('Update Color');
    expect(mockBeginUndoableChange).toBeCalledTimes(2);
    expect(mockBeginUndoableChange).toHaveBeenNthCalledWith(1, 'fill', ['2']);
    expect(mockBeginUndoableChange).toHaveBeenNthCalledWith(2, 'stroke', ['3']);
    expect(mockChangeSelectedAttributeNoUndo).toHaveBeenCalledTimes(2);
    expect(mockChangeSelectedAttributeNoUndo).toHaveBeenNthCalledWith(1, 'fill', '#FFFFFF', ['2']);
    expect(mockChangeSelectedAttributeNoUndo).toHaveBeenNthCalledWith(2, 'stroke', '#FFFFFF', [
      '3',
    ]);
    expect(mockFinishUndoableChange).toHaveBeenCalledTimes(2);
    expect(mockAddSubCommand).toBeCalledTimes(2);
    expect(mockAddSubCommand).toHaveBeenNthCalledWith(1, mockChangeCmd);
    expect(mockAddSubCommand).toHaveBeenNthCalledWith(2, mockChangeCmd);
    expect(mockAddCommandToHistory).not.toBeCalled();
    expect(mockReRenderImageSymbolArray).toBeCalledTimes(1);
    expect(mockReRenderImageSymbolArray).toHaveBeenLastCalledWith(expect.anything(), {
      force: true,
    });
    act(() => {
      fireEvent.click(getByText('onChange'));
    });
    expect(mockCreateBatchCommand).toBeCalledTimes(3);
    expect(mockBeginUndoableChange).toBeCalledTimes(6);
    expect(mockBeginUndoableChange).toHaveBeenNthCalledWith(3, 'fill', ['2']);
    expect(mockBeginUndoableChange).toHaveBeenNthCalledWith(4, 'stroke', ['3']);
    expect(mockBeginUndoableChange).toHaveBeenNthCalledWith(5, 'fill', ['2']);
    expect(mockBeginUndoableChange).toHaveBeenNthCalledWith(6, 'stroke', ['3']);
    expect(mockChangeSelectedAttributeNoUndo).toHaveBeenCalledTimes(6);
    expect(mockChangeSelectedAttributeNoUndo).toHaveBeenNthCalledWith(3, 'fill', '#FFAAFF', ['2']);
    expect(mockChangeSelectedAttributeNoUndo).toHaveBeenNthCalledWith(4, 'stroke', '#FFAAFF', [
      '3',
    ]);
    expect(mockChangeSelectedAttributeNoUndo).toHaveBeenNthCalledWith(5, 'fill', '#AAAAFF', ['2']);
    expect(mockChangeSelectedAttributeNoUndo).toHaveBeenNthCalledWith(6, 'stroke', '#AAAAFF', [
      '3',
    ]);
    expect(mockFinishUndoableChange).toHaveBeenCalledTimes(6);
    expect(mockAddSubCommand).toBeCalledTimes(6);
    expect(mockAddCommandToHistory).toBeCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenLastCalledWith(mockBatchCommand);
    expect(mockReRenderImageSymbolArray).toBeCalledTimes(2);
    expect(mockReRenderImageSymbolArray).toHaveBeenLastCalledWith(expect.anything(), {
      force: true,
    });
  });
});
