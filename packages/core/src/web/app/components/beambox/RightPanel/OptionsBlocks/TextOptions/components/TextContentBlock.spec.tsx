import React from 'react';

import { fireEvent, render } from '@testing-library/react';

const mockGetTextContent = jest.fn().mockReturnValue('Hello\nWorld');
const mockRenderText = jest.fn();
const mockOn = jest.fn();
const mockRemoveListener = jest.fn();
const mockAddCommandToHistory = jest.fn();
const mockChangeTextCommand = jest.fn();

jest.mock('@core/app/svgedit/text/textedit', () => ({
  __esModule: true,
  getTextContent: (...args: any[]) => mockGetTextContent(...args),
  renderText: (...args: any[]) => mockRenderText(...args),
  textContentEvents: { on: (...args: any[]) => mockOn(...args), removeListener: (...args: any[]) => mockRemoveListener(...args) },
}));

jest.mock('@core/app/svgedit/history/history', () => ({
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

  test('should create ChangeTextCommand on blur when text changed', () => {
    const { container } = render(<TextContentBlock textElement={mockTextElement} />);
    const textarea = container.querySelector('textarea')!;

    fireEvent.focus(textarea);
    fireEvent.change(textarea, { target: { value: 'New text' } });
    fireEvent.blur(textarea);

    expect(mockChangeTextCommand).toHaveBeenCalledWith(mockTextElement, 'Hello\u0085World', 'New text');
    expect(mockAddCommandToHistory).toHaveBeenCalled();
  });

  test('should not create ChangeTextCommand on blur when text unchanged', () => {
    const { container } = render(<TextContentBlock textElement={mockTextElement} />);
    const textarea = container.querySelector('textarea')!;

    fireEvent.focus(textarea);
    fireEvent.blur(textarea);

    expect(mockChangeTextCommand).not.toHaveBeenCalled();
    expect(mockAddCommandToHistory).not.toHaveBeenCalled();
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
