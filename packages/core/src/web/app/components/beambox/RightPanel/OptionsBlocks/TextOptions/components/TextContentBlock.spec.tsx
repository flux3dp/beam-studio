import React from 'react';

import { fireEvent, render } from '@testing-library/react';

const mockGetTextContent = jest.fn().mockReturnValue('Hello\nWorld');

const mockRenderText = jest.fn((_elem: any, val: string) => {
  mockGetTextContent.mockReturnValue(val.replace(/\u0085/g, '\n'));
});
const mockOn = jest.fn();
const mockRemoveListener = jest.fn();
const mockAddCommandToHistory = jest.fn();
const mockChangeTextCommand = jest.fn();
const mockBatchCommand = jest.fn();
const mockAddSubCommand = jest.fn();
const mockDeleteElements = jest.fn();
const mockToSelectMode = jest.fn();
// textActions.isEditing is a mutable field on the singleton, so expose it through a
// getter and flip `.value` per test rather than re-mocking the module.
const mockIsEditing = { value: false };

jest.mock('@core/app/svgedit/text/textedit', () => ({
  __esModule: true,
  getTextContent: (...args: any[]) => mockGetTextContent(...args),
  renderText: (...args: any[]) => mockRenderText(...args),
  textContentEvents: {
    on: (...args: any[]) => mockOn(...args),
    removeListener: (...args: any[]) => mockRemoveListener(...args),
  },
}));

jest.mock('@core/app/svgedit/text/textactions', () => ({
  get isEditing() {
    return mockIsEditing.value;
  },
  toSelectMode: (...args: any[]) => mockToSelectMode(...args),
}));

jest.mock('@core/app/svgedit/operations/delete', () => ({
  deleteElements: (...args: any[]) => mockDeleteElements(...args),
}));

jest.mock('@core/app/svgedit/history/history', () => ({
  BatchCommand: class {
    addSubCommand = (...args: any[]) => mockAddSubCommand(...args);
    constructor(...args: any[]) {
      mockBatchCommand(...args);
    }
  },
  ChangeTextCommand: class {
    constructor(...args: any[]) {
      mockChangeTextCommand(...args);
    }
  },
}));

jest.mock('@core/app/svgedit/history/undoManager', () => ({
  addCommandToHistory: (...args: any[]) => mockAddCommandToHistory(...args),
}));

jest.mock('antd', () => ({
  Input: {
    TextArea: ({ autoSize, id, onBlur, onChange, onFocus, value }: any) => (
      <textarea
        data-autosize={JSON.stringify(autoSize)}
        id={id}
        onBlur={onBlur}
        onChange={onChange}
        onFocus={onFocus}
        value={value}
      />
    ),
  },
}));

import TextContentBlock from './TextContentBlock';

describe('TextContentBlock', () => {
  const mockTextElement = document.createElement('text') as unknown as SVGTextElement;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTextContent.mockReturnValue('Hello\nWorld');
    mockDeleteElements.mockReturnValue({ type: 'delete-cmd' });
    mockIsEditing.value = false;
  });

  test('should render textarea with text content', () => {
    const { container } = render(<TextContentBlock textElement={mockTextElement} />);
    const textarea = container.querySelector('textarea');

    expect(textarea).toBeInTheDocument();
    expect(textarea?.value).toBe('Hello\nWorld');
  });

  test('should subscribe to textContentEvents on mount and unsubscribe on unmount', () => {
    const { unmount } = render(<TextContentBlock textElement={mockTextElement} />);

    expect(mockOn).toHaveBeenCalledWith('changed', expect.any(Function));

    unmount();

    expect(mockRemoveListener).toHaveBeenCalledWith('changed', expect.any(Function));
  });

  test('should call renderText on change with \\u0085 separator', () => {
    const { container } = render(<TextContentBlock textElement={mockTextElement} />);
    const textarea = container.querySelector('textarea')!;

    fireEvent.change(textarea, { target: { value: 'Line1\nLine2\nLine3' } });

    expect(mockRenderText).toHaveBeenCalledWith(mockTextElement, 'Line1\u0085Line2\u0085Line3', true);
  });

  test('should record a batch command with ChangeTextCommand on blur when text changed', () => {
    const { container } = render(<TextContentBlock textElement={mockTextElement} />);
    const textarea = container.querySelector('textarea')!;

    fireEvent.focus(textarea);
    fireEvent.change(textarea, { target: { value: 'New text' } });
    fireEvent.blur(textarea);

    expect(mockBatchCommand).toHaveBeenCalledWith('Change Text Content');
    expect(mockChangeTextCommand).toHaveBeenCalledWith(mockTextElement, 'Hello\u0085World', 'New text');
    expect(mockAddSubCommand).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
  });

  test('should not delete the text element on blur when the new content is not empty', () => {
    const { container } = render(<TextContentBlock textElement={mockTextElement} />);
    const textarea = container.querySelector('textarea')!;

    fireEvent.focus(textarea);
    fireEvent.change(textarea, { target: { value: 'New text' } });
    fireEvent.blur(textarea);

    expect(mockDeleteElements).not.toHaveBeenCalled();
  });

  test('should delete the text element on blur when the content is cleared', () => {
    const { container } = render(<TextContentBlock textElement={mockTextElement} />);
    const textarea = container.querySelector('textarea')!;

    fireEvent.focus(textarea);
    fireEvent.change(textarea, { target: { value: '' } });
    fireEvent.blur(textarea);

    expect(mockChangeTextCommand).toHaveBeenCalledWith(mockTextElement, 'Hello\u0085World', '');
    expect(mockDeleteElements).toHaveBeenCalledWith([mockTextElement], true);
    // The delete command is batched together with the text change, so a single undo reverts both
    expect(mockAddSubCommand).toHaveBeenCalledTimes(2);
    expect(mockAddSubCommand).toHaveBeenLastCalledWith({ type: 'delete-cmd' });
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
  });

  test('should not create ChangeTextCommand on blur when text unchanged', () => {
    const { container } = render(<TextContentBlock textElement={mockTextElement} />);
    const textarea = container.querySelector('textarea')!;

    fireEvent.focus(textarea);
    fireEvent.blur(textarea);

    expect(mockChangeTextCommand).not.toHaveBeenCalled();
    expect(mockAddCommandToHistory).not.toHaveBeenCalled();
    expect(mockDeleteElements).not.toHaveBeenCalled();
  });

  test('should defer to textActions.toSelectMode on blur while canvas editing is active', () => {
    const { container } = render(<TextContentBlock textElement={mockTextElement} />);
    const textarea = container.querySelector('textarea')!;

    fireEvent.focus(textarea);
    fireEvent.change(textarea, { target: { value: 'New text' } });
    mockIsEditing.value = true;
    fireEvent.blur(textarea);

    expect(mockToSelectMode).toHaveBeenCalledTimes(1);
    // toSelectMode records the history itself, so this block must not add its own command
    expect(mockChangeTextCommand).not.toHaveBeenCalled();
    expect(mockBatchCommand).not.toHaveBeenCalled();
    expect(mockAddCommandToHistory).not.toHaveBeenCalled();
  });

  test('should not delete the text element while canvas editing is active and content is cleared', () => {
    const { container } = render(<TextContentBlock textElement={mockTextElement} />);
    const textarea = container.querySelector('textarea')!;

    fireEvent.focus(textarea);
    fireEvent.change(textarea, { target: { value: '' } });
    mockIsEditing.value = true;
    fireEvent.blur(textarea);

    expect(mockToSelectMode).toHaveBeenCalledTimes(1);
    expect(mockDeleteElements).not.toHaveBeenCalled();
  });

  test('should sync content when textContentEvents emits changed', () => {
    mockGetTextContent.mockReturnValue('Initial');
    render(<TextContentBlock textElement={mockTextElement} />);

    // Get the callback registered with textContentEvents.on('changed', ...)
    const onChangedCallback = mockOn.mock.calls.find((call: any[]) => call[0] === 'changed')?.[1];

    expect(onChangedCallback).toBeDefined();

    // Simulate canvas editing: update the return value and trigger the event
    mockGetTextContent.mockReturnValue('Updated from canvas');
    onChangedCallback();

    // The component should have re-read from getTextContent
    expect(mockGetTextContent).toHaveBeenCalledWith(mockTextElement);
  });
});
