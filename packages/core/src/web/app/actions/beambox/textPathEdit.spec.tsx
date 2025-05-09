const mockMoveElementCommand = jest.fn();
const mockChangeElementCommand = jest.fn();
const mockInsertElementCommand = jest.fn();
const mockRemoveElementCommand = jest.fn();
const mockAddSubCommand = jest.fn();
const mockIsEmpty = jest.fn();
const mockBatchCommand = jest.fn().mockImplementation(() => ({
  addSubCommand: mockAddSubCommand,
  isEmpty: mockIsEmpty,
}));

jest.mock('@core/app/svgedit/history/history', () => ({
  BatchCommand: mockBatchCommand,
  ChangeElementCommand: mockChangeElementCommand,
  InsertElementCommand: mockInsertElementCommand,
  MoveElementCommand: mockMoveElementCommand,
  RemoveElementCommand: mockRemoveElementCommand,
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
  changeSelectedAttribute: jest.fn(),
  changeSelectedAttributeNoUndo: jest.fn(),
  getNextId: jest.fn(),
  pathActions: {
    toEditMode: jest.fn(),
  },
  pushGroupProperties: jest.fn(),
  selectOnly: jest.fn(),
};

jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync: (callback) =>
    callback({
      Canvas: mockSvgCanvas,
    }),
}));

const textAndPathHtml = `
<div>
  <svg viewBox="0 0 100 100">
    <path id="path" d="M50,50 L50,70 L70,70" fill="none" stroke="black" />
    <text id="text" x="20" y="20"><tspan>abc</tspan></text>
  </svg>
</div>`;

const textPathHtml = `
<div>
  <svg viewBox="0 0 100 100">
    <g>
      <path id="path" d="M50,50 L50,70 L70,70" fill="none" stroke="black" />
      <text id="text" data-origX="20" data-origY="20">
        <textPath href="#path" startOffset="10%" alignment-baseline="middle" dominant-baseline="middle">abc</textPath>
      </text>
      <text id="text2" data-origX="20" data-origY="20">
        <textPath href="#path" startOffset="15%" alignment-baseline="top" dominant-baseline="hanging">abc</textPath>
      </text>
    </g>
  </svg>
</div>`;

import textPathEdit, { VerticalAlign } from './textPathEdit';

describe('test textPathEdit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('ungroupTextPath', () => {
    document.body.innerHTML = textPathHtml;

    const g = document.getElementsByTagName('g')[0];

    textPathEdit.ungroupTextPath(g);
    expect(document.getElementsByTagName('g').length).toBe(0);

    const svg = document.getElementsByTagName('svg')[0];

    expect(document.getElementById('path').parentElement).toBe(svg);
    expect(document.getElementById('text').parentElement).toBe(svg);
  });

  test('attachTextToPath', () => {
    document.body.innerHTML = textAndPathHtml;

    const path = document.getElementById('path');
    const text = document.getElementById('text');

    textPathEdit.attachTextToPath(text, path, false);

    const textPath = document.getElementsByTagName('textPath');

    expect(textPath.length).toBe(1);
    expect(textPath[0].parentElement).toBe(text);
    expect(textPath[0].getAttribute('href')).toBe('#path');
    expect(mockSvgCanvas.selectOnly).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
  });

  test('detachText', () => {
    document.body.innerHTML = textPathHtml;

    const g = document.getElementsByTagName('g')[0];
    const text = document.getElementById('text');
    const { textContent } = text;

    textPathEdit.detachText(g, false);
    expect(text.textContent.trim()).toBe(textContent.trim());
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
  });

  test('editPath', () => {
    document.body.innerHTML = textPathHtml;

    const g = document.getElementsByTagName('g')[0];
    const path = document.getElementById('path');

    textPathEdit.editPath(g);
    expect(mockSvgCanvas.pathActions.toEditMode).toHaveBeenCalledTimes(1);
    expect(mockSvgCanvas.pathActions.toEditMode).toHaveBeenCalledWith(path);
  });

  test('getStartOffset', () => {
    document.body.innerHTML = textPathHtml;

    const textPath = document.getElementsByTagName('textPath')[0];

    expect(textPathEdit.getStartOffset(textPath)).toBe(10);
  });

  test('getVerticalAlign', () => {
    document.body.innerHTML = textPathHtml;

    const textPath = document.getElementsByTagName('textPath')[0];

    expect(textPathEdit.getVerticalAlign(textPath)).toBe(VerticalAlign.MIDDLE);
  });

  test('setStartOffset', () => {
    document.body.innerHTML = textPathHtml;

    const g = document.getElementsByTagName('g')[0];
    const textPath = Array.from(document.getElementsByTagName('textPath'));

    textPathEdit.setStartOffset(20, g);
    expect(mockSvgCanvas.changeSelectedAttribute).toHaveBeenCalledWith('startOffset', '20%', textPath);
  });

  test('setVerticalAlign', () => {
    document.body.innerHTML = textPathHtml;

    const g = document.getElementsByTagName('g')[0];
    const textPath = Array.from(document.getElementsByTagName('textPath'));

    textPathEdit.setVerticalAlign(VerticalAlign.MIDDLE, g);
    expect(mockBeginUndoableChange).toHaveBeenNthCalledWith(1, 'alignment-baseline', textPath);
    expect(mockBeginUndoableChange).toHaveBeenNthCalledWith(2, 'dominant-baseline', textPath);
    expect(mockSvgCanvas.changeSelectedAttributeNoUndo).toHaveBeenNthCalledWith(
      1,
      'alignment-baseline',
      'middle',
      textPath,
    );
    expect(mockSvgCanvas.changeSelectedAttributeNoUndo).toHaveBeenNthCalledWith(
      2,
      'dominant-baseline',
      'middle',
      textPath,
    );
    expect(mockFinishUndoableChange).toHaveBeenCalledTimes(2);
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();
    textPathEdit.setVerticalAlign(VerticalAlign.TOP, g);
    expect(mockBeginUndoableChange).toHaveBeenNthCalledWith(1, 'alignment-baseline', textPath);
    expect(mockBeginUndoableChange).toHaveBeenNthCalledWith(2, 'dominant-baseline', textPath);
    expect(mockSvgCanvas.changeSelectedAttributeNoUndo).toHaveBeenNthCalledWith(
      1,
      'alignment-baseline',
      'top',
      textPath,
    );
    expect(mockSvgCanvas.changeSelectedAttributeNoUndo).toHaveBeenNthCalledWith(
      2,
      'dominant-baseline',
      'hanging',
      textPath,
    );
    expect(mockFinishUndoableChange).toHaveBeenCalledTimes(2);
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
  });
});
