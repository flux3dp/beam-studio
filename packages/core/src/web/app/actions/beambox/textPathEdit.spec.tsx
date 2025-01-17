/* eslint-disable import/first */
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

jest.mock('app/svgedit/history/history', () => ({
  MoveElementCommand: mockMoveElementCommand,
  ChangeElementCommand: mockChangeElementCommand,
  InsertElementCommand: mockInsertElementCommand,
  RemoveElementCommand: mockRemoveElementCommand,
  BatchCommand: mockBatchCommand,
}));

const mockResize = jest.fn();
const mockSelector = {
  resize: mockResize,
};
const mockSelectManager = {
  requestSelector: () => mockSelector,
  resizeSelectors: jest.fn(),
};

jest.mock('app/svgedit/selector', () => ({
  getSelectorManager: () => mockSelectManager,
}));

const mockSvgCanvas = {
  changeSelectedAttribute: jest.fn(),
  getNextId: jest.fn(),
  pushGroupProperties: jest.fn(),
  selectOnly: jest.fn(),
  pathActions: {
    toEditMode: jest.fn(),
  },
  undoMgr: {
    addCommandToHistory: jest.fn(),
  },
};

jest.mock('helpers/svg-editor-helper', () => ({
  getSVGAsync: (callback) => (callback({
    Canvas: mockSvgCanvas,
  })),
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
        <textPath href="#path">abc</textPath>
      </text>
    </g>
  </svg>
</div>`;

import textPathEdit, { VerticalAlign } from './textPathEdit';

describe('test textPathEdit', () => {
  beforeEach(() => {
    mockMoveElementCommand.mockClear();
    mockChangeElementCommand.mockClear();
    mockInsertElementCommand.mockClear();
    mockRemoveElementCommand.mockClear();
    mockAddSubCommand.mockClear();
    mockIsEmpty.mockClear();
    mockAddSubCommand.mockClear();
    mockSvgCanvas.undoMgr.addCommandToHistory.mockClear();
  });

  test('test ungroupTextPath', () => {
    document.body.innerHTML = textPathHtml;
    const g = document.getElementsByTagName('g')[0];
    textPathEdit.ungroupTextPath(g);
    expect(document.getElementsByTagName('g').length).toBe(0);
    const svg = document.getElementsByTagName('svg')[0];
    expect(document.getElementById('path').parentElement).toBe(svg);
    expect(document.getElementById('text').parentElement).toBe(svg);
  });

  test('test attachTextToPath', () => {
    document.body.innerHTML = textAndPathHtml;
    const path = document.getElementById('path');
    const text = document.getElementById('text');
    textPathEdit.attachTextToPath(text, path, false);
    const textPath = document.getElementsByTagName('textPath');
    expect(textPath.length).toBe(1);
    expect(textPath[0].parentElement).toBe(text);
    expect(textPath[0].getAttribute('href')).toBe('#path');
    expect(mockSvgCanvas.selectOnly).toBeCalledTimes(1);
    expect(mockSvgCanvas.undoMgr.addCommandToHistory).toBeCalledTimes(1);
  });

  test('test detachText', () => {
    document.body.innerHTML = textPathHtml;
    const g = document.getElementsByTagName('g')[0];
    const text = document.getElementById('text');
    const { textContent } = text;
    textPathEdit.detachText(g, false);
    expect(text.textContent.trim()).toBe(textContent.trim());
    expect(mockSvgCanvas.undoMgr.addCommandToHistory).toBeCalledTimes(1);
  });

  test('test setStartOffset', () => {
    document.body.innerHTML = textPathHtml;
    const text = document.getElementById('text') as unknown as SVGTextElement;
    const textPath = document.getElementsByTagName('textPath')[0];
    textPathEdit.setStartOffset(20, text);
    expect(mockSvgCanvas.changeSelectedAttribute).toBeCalledWith('startOffset', '20%', [textPath]);
  });

  test('test setVerticalAlign', () => {
    document.body.innerHTML = textPathHtml;
    const text = document.getElementById('text') as unknown as SVGTextElement;
    const textPath = document.getElementsByTagName('textPath')[0];
    textPathEdit.setVerticalAlign(text, VerticalAlign.MIDDLE);
    expect(textPath.getAttribute('dominant-baseline')).toBe('middle');
    expect(textPath.getAttribute('alignment-baseline')).toBe('middle');
    textPathEdit.setVerticalAlign(text, VerticalAlign.TOP);
    expect(textPath.getAttribute('dominant-baseline')).toBe('hanging');
    expect(textPath.getAttribute('alignment-baseline')).toBe('top');
  });
});
