import React from 'react';

import { fireEvent, render } from '@testing-library/react';

const mockShowVariableTextSettings = jest.fn();

jest.mock('@core/app/components/dialogs/VariableTextSettings', () => ({
  showVariableTextSettings: mockShowVariableTextSettings,
}));

const mockAddSubCommand = jest.fn();
const mockBatchCommand = jest.fn().mockImplementation(() => ({ addSubCommand: mockAddSubCommand }));

jest.mock('@core/app/svgedit/history/history', () => ({
  BatchCommand: mockBatchCommand,
}));

const mockAddCommandToHistory = jest.fn();
const mockBeginUndoableChange = jest.fn();
const mockFinishUndoableChange = jest.fn();

jest.mock('@core/app/svgedit/history/undoManager', () => ({
  addCommandToHistory: mockAddCommandToHistory,
  beginUndoableChange: mockBeginUndoableChange,
  finishUndoableChange: mockFinishUndoableChange,
}));

const mockSvgCanvas = {
  changeSelectedAttribute: jest
    .fn()
    .mockImplementation((attr, value, elems) => elems.forEach((elem) => elem.setAttribute(attr, value))),
  changeSelectedAttributeNoUndo: jest
    .fn()
    .mockImplementation((attr, value, elems) => elems.forEach((elem) => elem.setAttribute(attr, value))),
};

jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync: (callback) =>
    callback({
      Canvas: mockSvgCanvas,
    }),
}));

const mockOpen = jest.fn();

jest.mock('@core/implementations/browser', () => ({
  open: mockOpen,
}));

const mockGetVariableTextType = jest.fn().mockImplementation((elem) => +(elem.getAttribute('data-vt-type') ?? '0'));
const mockGetVariableTextOffset = jest.fn().mockImplementation((elem) => +(elem.getAttribute('data-vt-offset') ?? '0'));
const mockIsVariableTextSupported = jest.fn();

jest.mock('@core/helpers/variableText', () => ({
  getVariableTextOffset: mockGetVariableTextOffset,
  getVariableTextType: mockGetVariableTextType,
  isVariableTextSupported: mockIsVariableTextSupported,
}));

import VariableTextBlock from './VariableTextBlock';

describe('test VariableTextBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsVariableTextSupported.mockReturnValue(true);
    document.body.innerHTML =
      '<g id="svg_1"><text id="svg_2" data-vt-type="3" data-vt-offset="10"></text><text id="svg_3"></text></g>';
  });

  test('not support variable texts', () => {
    mockIsVariableTextSupported.mockReturnValue(false);

    const elems = Array.from(document.querySelectorAll('text'));
    const { container } = render(<VariableTextBlock elems={elems} id="svg_1" withDivider />);

    expect(container).toBeEmptyDOMElement();
  });

  it('should render divider correctly', () => {
    const elems = Array.from(document.querySelectorAll('text'));
    const { container } = render(<VariableTextBlock elems={elems} id="svg_1" withDivider />);

    expect(container).toMatchSnapshot();
  });

  it('should handle value changes correctly', () => {
    const elems = Array.from(document.querySelectorAll('text'));
    const { baseElement, getByRole, getByText } = render(<VariableTextBlock elems={elems} id="svg_1" />);

    expect(baseElement).toMatchSnapshot();

    fireEvent.click(getByRole('switch'));
    expect(mockBeginUndoableChange).toHaveBeenNthCalledWith(1, 'data-vt-type', elems);
    expect(mockBeginUndoableChange).toHaveBeenNthCalledWith(2, 'data-vt-offset', [elems[1]]);
    expect(mockSvgCanvas.changeSelectedAttributeNoUndo).toHaveBeenCalledWith('data-vt-offset', '0', [elems[1]]);
    expect(mockFinishUndoableChange).toHaveBeenCalledTimes(2);
    expect(mockAddSubCommand).toHaveBeenCalledTimes(2);
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    expect(baseElement).toMatchSnapshot();

    fireEvent.click(baseElement.querySelector('.icon'));
    expect(mockOpen).toHaveBeenCalledWith('https://support.flux3dp.com/hc/en-us/articles/12689396604175');
    fireEvent.click(document.querySelector('.ant-btn-text'));
    expect(mockShowVariableTextSettings).toHaveBeenCalled();

    jest.clearAllMocks();
    fireEvent.input(baseElement.querySelector('#variable-text-offset'), { target: { value: '20' } });
    expect(mockSvgCanvas.changeSelectedAttribute).toHaveBeenNthCalledWith(1, 'data-vt-offset', 20, elems);

    jest.clearAllMocks();
    fireEvent.mouseDown(baseElement.querySelector('.ant-select-selector'));
    fireEvent.click(getByText('Current Time'));
    expect(mockSvgCanvas.changeSelectedAttribute).toHaveBeenNthCalledWith(1, 'data-vt-type', 2, elems);
    expect(baseElement).toMatchSnapshot();

    jest.clearAllMocks();
    fireEvent.click(getByRole('switch'));
    expect(mockSvgCanvas.changeSelectedAttribute).toHaveBeenNthCalledWith(1, 'data-vt-type', 0, elems);
    expect(baseElement).toMatchSnapshot();
  });
});
