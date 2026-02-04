const mockGetDocumentState = jest.fn();

jest.mock('@core/app/stores/documentStore', () => ({
  useDocumentStore: { getState: mockGetDocumentState },
}));

const insertSvgElement = (svg: SVGElement) => {
  const container = document.createElement('mock-use');

  container.appendChild(svg);
  document.body.appendChild(container);

  return container;
};
const mockImportBarcodeSvgElement = jest.fn().mockImplementation(insertSvgElement);
const mockImportQrCodeSvgElement = jest.fn().mockImplementation(insertSvgElement);

jest.mock('@core/app/components/dialogs/CodeGenerator/svgOperation', () => ({
  importBarcodeSvgElement: mockImportBarcodeSvgElement,
  importQrCodeSvgElement: mockImportQrCodeSvgElement,
}));

const mockGetState = jest.fn();

jest.mock('@core/app/stores/variableText', () => ({
  useVariableTextState: { getState: mockGetState },
}));

const mockAddSubCommand = jest.fn();
const mockUnapply = jest.fn();
const mockBatchCommand = jest
  .fn()
  .mockImplementation(() => ({ addSubCommand: mockAddSubCommand, unapply: mockUnapply }));
const mockChangeTextCommand = jest.fn();
const mockChangeElementCommand = jest.fn();
const mockMoveElementCommand = jest.fn();
const mockRemoveElementCommand = jest.fn();

jest.mock('@core/app/svgedit/history/history', () => ({
  BatchCommand: mockBatchCommand,
  ChangeElementCommand: mockChangeElementCommand,
  ChangeTextCommand: mockChangeTextCommand,
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

const mockClear = jest.fn();

jest.mock('@core/app/svgedit/text/textactions', () => ({
  clear: mockClear,
}));

const mockRenderText = jest.fn().mockImplementation((elem, value) => {
  elem.innerHTML = `<tspan>${value.replaceAll('\u0085', '</tspan><tspan>')}</tspan>`;
});

jest.mock('@core/app/svgedit/text/textedit', () => ({
  renderText: mockRenderText,
}));

jest.mock('@core/helpers/layer/layer-helper', () => ({
  getObjectLayer: () => 'mock-layer',
}));

const mockGetLocalizedTime = jest.fn();

jest.mock('@core/helpers/getLocalizedTime', () => ({
  __esModule: true,
  default: () => mockGetLocalizedTime(),
}));

const mockClearSelection = jest.fn();

jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync: (callback) =>
    callback({
      Canvas: {
        clearSelection: mockClearSelection,
        getCurrentDrawing: () => ({ setCurrentLayer: jest.fn() }),
        selectorManager: { releaseSelectors: jest.fn() },
      },
    }),
}));

const mockBody = {
  convertVariableText: `
<g id="svg_1" class="layer">
<text id="svg_2"><tspan>ddd</tspan></text>
<text id="svg_3" data-vt-type="1" data-vt-offset="1234"><tspan>ddd</tspan></text>
<text id="svg_4" data-vt-type="1" data-vt-offset="30"><tspan>ddd</tspan></text>
<text id="svg_5" data-vt-type="1" data-vt-offset="30"><tspan>0ddd</tspan></text>
<text id="svg_6" data-vt-type="1" data-vt-offset="30"><tspan>0hhh</tspan></text>
<text id="svg_7" data-vt-type="1" data-vt-offset="30"><tspan>0HHH</tspan></text>
<text id="svg_8" data-vt-type="1" data-vt-offset="30"><tspan>Not</tspan><tspan>Number</tspan></text>
<text id="svg_9" data-vt-type="2"><tspan>[YYYYescape] YYYY-MM-DD</tspan><tspan>HH:mm:ss.SSSZ[Z]</tspan><tspan>dddd MMMM</tspan></text>
<text id="svg_10" data-vt-type="3" data-vt-offset="0"><tspan>Name: %0</tspan><tspan>Type: %3</tspan><tspan>Key: %1</tspan></text>
<text id="svg_11" data-vt-type="3" data-vt-offset="1"><tspan>Name: %0</tspan><tspan>Type: %3</tspan><tspan>Key: %1</tspan></text>
<text id="svg_12" data-vt-type="3" data-vt-offset="2"><tspan>Name: %0</tspan><tspan>Type: %3</tspan><tspan>Key: %1</tspan></text>
<use id="svg_13" data-vt-type="1" data-vt-offset="0" data-invert="false" data-props="{&quot;errorLevel&quot;:&quot;L&quot;,&quot;isInvert&quot;:false,&quot;value&quot;:&quot;ddd&quot;}" data-code="qrcode"></use>
<use id="svg_14" data-vt-type="2" data-vt-offset="0" data-invert="true" data-props="{&quot;options&quot;:{&quot;background&quot;:&quot;#000000&quot;,&quot;displayValue&quot;:true,&quot;ean128&quot;:false,&quot;font&quot;:&quot;Noto Sans&quot;,&quot;fontOptions&quot;:&quot; bold&quot;,&quot;fontSize&quot;:20,&quot;format&quot;:&quot;CODE128&quot;,&quot;height&quot;:50,&quot;lineColor&quot;:&quot;#ffffff&quot;,&quot;margin&quot;:10,&quot;textAlign&quot;:&quot;center&quot;,&quot;textMargin&quot;:2,&quot;textPosition&quot;:&quot;bottom&quot;,&quot;width&quot;:2},&quot;value&quot;:&quot;HH:mm:ss&quot;}" data-code="barcode"></use>
</g>
`,
  extractVariableText: `
<g id="svgcontent">
<g id="svg_1" class="layer">
<text id="svg_2"><tspan></tspan></text>
<text id="svg_3" data-vt-type="1"><tspan></tspan></text>
<text id="svg_4" data-vt-type="1"><tspan></tspan></text>
</g>
<g id="svg_5" class="layer">
<text id="svg_6"><tspan></tspan></text>
</g>
<g id="svg_7" class="layer" display="none">
<text id="svg_8" data-vt-type="1"></text>
</g>
</g>
`,
  getVariableTexts: `
<g id="svg_1" class="layer" display="none">
<text id="svg_2" ></text>
<text id="svg_3" data-vt-type="0"></text>
<text id="svg_4" data-vt-type="1"></text>
<text id="svg_5" data-vt-type="2"></text>
<text id="svg_6" data-vt-type="3"></text>
</g>
<g id="svg_11" class="layer">
<text id="svg_7" data-vt-type="0"></text>
<text id="svg_8" data-vt-type="1"></text>
<text id="svg_9" data-vt-type="2"></text>
<text id="svg_10" data-vt-type="3"></text>
</g>
`,
  removeVariableText: `
<g id="svg_1" class="layer">
<text id="svg_2"></text>
<text id="svg_3" data-vt-type="1"></text>
<text id="svg_4" data-vt-type="1"></text>
</g>
<g id="svg_5" class="layer">
<text id="svg_6"></text>
<text id="svg_7" data-vt-type="1"></text>
</g>
<g id="svg_8" class="layer" display="none">
<text id="svg_9" data-vt-type="1"></text>
</g>
`,
};

import { VariableTextType } from '@core/interfaces/ObjectPanel';
import {
  convertVariableText,
  extractVariableText,
  getRealCurrent,
  getVariableTextOffset,
  getVariableTexts,
  getVariableTextType,
  hasVariableText,
  isVariableTextSupported,
  removeVariableText,
} from './variableText';

describe('test variableText helper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDocumentState.mockReturnValue({ workarea: 'fpm1' });
  });

  test('isVariableTextSupported', () => {
    expect(isVariableTextSupported()).toBe(true);
  });

  test('getVariableTextType', () => {
    let elem: SVGTextElement;

    document.body.innerHTML = '<text></text>';
    elem = document.querySelector('text');
    expect(getVariableTextType(elem)).toBe(VariableTextType.NONE);

    document.body.innerHTML = '<text data-vt-type="0"></text>';
    elem = document.querySelector('text');
    expect(getVariableTextType(elem)).toBe(VariableTextType.NONE);

    document.body.innerHTML = '<text data-vt-type="1"></text>';
    elem = document.querySelector('text');
    expect(getVariableTextType(elem)).toBe(VariableTextType.NUMBER);

    document.body.innerHTML = '<text data-vt-type="2"></text>';
    elem = document.querySelector('text');
    expect(getVariableTextType(elem)).toBe(VariableTextType.TIME);

    document.body.innerHTML = '<text data-vt-type="3"></text>';
    elem = document.querySelector('text');
    expect(getVariableTextType(elem)).toBe(VariableTextType.CSV);
  });

  test('getVariableTextOffset', () => {
    let elem: SVGTextElement;

    document.body.innerHTML = '<text></text>';
    elem = document.querySelector('text');
    expect(getVariableTextOffset(elem)).toBe(0);

    document.body.innerHTML = '<text data-vt-offset="0"></text>';
    elem = document.querySelector('text');
    expect(getVariableTextOffset(elem)).toBe(0);

    document.body.innerHTML = '<text data-vt-offset="10"></text>';
    elem = document.querySelector('text');
    expect(getVariableTextOffset(elem)).toBe(10);
  });

  test('getVariableTexts', () => {
    document.body.innerHTML = mockBody.getVariableTexts;

    const checkIds = (elems: NodeListOf<SVGElement>, ids: string[]) => {
      expect(Array.from(elems).map((elem) => elem.id)).toEqual(ids);
    };

    checkIds(getVariableTexts(), ['svg_4', 'svg_5', 'svg_6', 'svg_8', 'svg_9', 'svg_10']);
    checkIds(getVariableTexts({ visibleOnly: true }), ['svg_8', 'svg_9', 'svg_10']);
    checkIds(getVariableTexts({ type: VariableTextType.NUMBER }), ['svg_4', 'svg_8']);
    checkIds(getVariableTexts({ type: VariableTextType.NUMBER, visibleOnly: true }), ['svg_8']);
    checkIds(getVariableTexts({ type: VariableTextType.TIME }), ['svg_5', 'svg_9']);
    checkIds(getVariableTexts({ type: VariableTextType.TIME, visibleOnly: true }), ['svg_9']);
    checkIds(getVariableTexts({ type: VariableTextType.CSV }), ['svg_6', 'svg_10']);
    checkIds(getVariableTexts({ type: VariableTextType.CSV, visibleOnly: true }), ['svg_10']);
  });

  test('isVariableTextExist', () => {
    document.body.innerHTML = '<text data-vt-type="0"></text>';
    expect(hasVariableText()).toBe(false);

    document.body.innerHTML = '<g class="layer" display="none"><text data-vt-type="1"></text></g>';
    expect(hasVariableText()).toBe(true);
    expect(hasVariableText({ visibleOnly: true })).toBe(false);

    document.body.innerHTML = '<text data-vt-type="1"></text><g></g>';
    expect(hasVariableText({ root: document.querySelector('g') })).toBe(false);
  });

  test('getRealCurrent', () => {
    expect(getRealCurrent(0, 0, 9)).toBe(0);
    expect(getRealCurrent(5, 0, 9)).toBe(5);
    expect(getRealCurrent(9, 0, 9)).toBe(9);
    expect(getRealCurrent(15, 0, 9)).toBe(5);
    expect(getRealCurrent(5, 10, 19)).toBe(15);
    expect(getRealCurrent(5, 19, 19)).toBe(19);
    expect(getRealCurrent(5, 30, 19)).toBe(30);
  });

  test('convertVariableText', async () => {
    let revert: (() => void) | null;
    let expectedResult: HTMLElement;
    const mockState: any = {
      csvContent: [
        ['Name 1', 'Key 1', 'Not important', 'Type 1'],
        ['Name 2', 'Key 2'],
      ],
      current: 0,
      end: 999,
      start: 0,
    };

    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-02-03T12:34:56.1234'));

    const dayjs = require('dayjs');

    require('dayjs/locale/zh-tw');
    dayjs.extend(require('dayjs/plugin/utc'));
    dayjs.extend(require('dayjs/plugin/timezone'));
    dayjs.locale('zh-tw');
    mockGetLocalizedTime.mockReturnValue(dayjs().tz('Asia/Taipei'));

    mockGetState.mockReturnValue(mockState);

    document.body.innerHTML = mockBody.convertVariableText;
    revert = await convertVariableText();
    expect(revert).not.toBe(null);
    expect(mockGetState).toHaveBeenCalled();
    expect(mockClearSelection).toHaveBeenCalled();
    expect(mockClear).toHaveBeenCalled();
    expect(mockChangeTextCommand).toHaveBeenCalledTimes(9);
    expect(mockRemoveElementCommand).toHaveBeenCalledTimes(2);
    expect(mockMoveElementCommand).toHaveBeenCalledTimes(2);
    expect(mockAddSubCommand).toHaveBeenCalledTimes(13);
    expect(mockRenderText).toHaveBeenCalledTimes(9);
    expect(mockImportBarcodeSvgElement).toHaveBeenCalledTimes(1);
    expect(mockImportQrCodeSvgElement).toHaveBeenCalledTimes(1);
    expect(mockChangeElementCommand).not.toHaveBeenCalled();
    expect(mockAddCommandToHistory).not.toHaveBeenCalled();
    expect(document.body).toMatchSnapshot();
    expectedResult = document.body;

    revert();
    expect(mockUnapply).toHaveBeenCalledTimes(1);
    expect(mockUnapply).toHaveBeenCalledWith({ handleHistoryEvent: expect.any(Function), renderText: mockRenderText });

    jest.clearAllMocks();
    document.body.innerHTML = mockBody.convertVariableText;
    revert = await convertVariableText({ configs: mockState });
    expect(revert).not.toBe(null);
    expect(mockGetState).not.toHaveBeenCalled();
    expect(mockClearSelection).toHaveBeenCalled();
    expect(mockClear).toHaveBeenCalled();
    expect(mockChangeTextCommand).toHaveBeenCalledTimes(9);
    expect(mockRemoveElementCommand).toHaveBeenCalledTimes(2);
    expect(mockMoveElementCommand).toHaveBeenCalledTimes(2);
    expect(mockAddSubCommand).toHaveBeenCalledTimes(13);
    expect(mockRenderText).toHaveBeenCalledTimes(9);
    expect(mockImportBarcodeSvgElement).toHaveBeenCalledTimes(1);
    expect(mockImportQrCodeSvgElement).toHaveBeenCalledTimes(1);
    expect(mockChangeElementCommand).not.toHaveBeenCalled();
    expect(mockAddCommandToHistory).not.toHaveBeenCalled();
    expect(document.body).toBe(expectedResult);

    revert();
    expect(mockUnapply).toHaveBeenCalledTimes(1);
    expect(mockUnapply).toHaveBeenCalledWith({ handleHistoryEvent: expect.any(Function), renderText: mockRenderText });

    jest.clearAllMocks();
    document.body.innerHTML = mockBody.convertVariableText;
    revert = await convertVariableText({ addToHistory: true, configs: mockState });
    expect(revert).toBe(null);
    expect(mockGetState).not.toHaveBeenCalled();
    expect(mockClearSelection).toHaveBeenCalled();
    expect(mockClear).toHaveBeenCalled();
    expect(mockChangeTextCommand).toHaveBeenCalledTimes(9);
    expect(mockRemoveElementCommand).toHaveBeenCalledTimes(2);
    expect(mockMoveElementCommand).toHaveBeenCalledTimes(2);
    expect(mockRenderText).toHaveBeenCalledTimes(9);
    expect(mockImportBarcodeSvgElement).toHaveBeenCalledTimes(1);
    expect(mockImportQrCodeSvgElement).toHaveBeenCalledTimes(1);
    expect(mockChangeElementCommand).toHaveBeenCalledTimes(10);
    expect(mockAddSubCommand).toHaveBeenCalledTimes(23);
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    expect(document.body).toBe(expectedResult);
  });

  test('removeVariableText', () => {
    let revert: (() => void) | null;

    document.body.innerHTML = mockBody.removeVariableText;
    revert = removeVariableText();
    expect(revert).not.toBe(null);
    expect(mockClearSelection).toHaveBeenCalled();
    expect(mockClear).toHaveBeenCalled();
    expect(document.body).toMatchSnapshot();

    revert();
    expect(document.body).toMatchSnapshot();
  });

  test('extractVariableText', () => {
    document.body.innerHTML = mockBody.extractVariableText;

    let expectedExtractResult: HTMLElement;
    let expectedRevertResult: HTMLElement;
    let extractFn = extractVariableText();

    expect(extractFn).not.toBe(null);
    expect(mockClearSelection).toHaveBeenCalledTimes(1);
    expect(mockClear).toHaveBeenCalledTimes(1);
    expect(document.body).toMatchSnapshot();
    expectedExtractResult = document.body;

    extractFn.revert();
    expect(mockClearSelection).toHaveBeenCalledTimes(2);
    expect(mockClear).toHaveBeenCalledTimes(2);
    expect(document.body).toMatchSnapshot();
    expectedRevertResult = document.body;

    extractFn.extract();
    expect(mockClearSelection).toHaveBeenCalledTimes(3);
    expect(mockClear).toHaveBeenCalledTimes(3);
    expect(document.body).toBe(expectedExtractResult);

    jest.clearAllMocks();
    document.body.innerHTML = mockBody.extractVariableText;
    extractFn = extractVariableText(false);
    expect(extractFn).not.toBe(null);
    expect(mockClearSelection).not.toHaveBeenCalled();
    expect(mockClear).not.toHaveBeenCalled();
    expect(document.body.innerHTML).toBe(mockBody.extractVariableText);

    extractFn.extract();
    expect(mockClearSelection).toHaveBeenCalledTimes(1);
    expect(mockClear).toHaveBeenCalledTimes(1);
    expect(document.body).toBe(expectedExtractResult);

    extractFn.revert();
    expect(mockClearSelection).toHaveBeenCalledTimes(2);
    expect(mockClear).toHaveBeenCalledTimes(2);
    expect(document.body).toBe(expectedRevertResult);
  });
});

describe('test variableText helper when not supported', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDocumentState.mockReturnValue({ workarea: 'ado1' });
  });

  test('isVariableTextSupported', () => {
    expect(isVariableTextSupported()).toBe(false);
  });

  test('isVariableTextExist', () => {
    document.body.innerHTML = '<text data-vt-type="1"></text>';
    expect(hasVariableText()).toBe(false);
  });

  test('convertVariableText', async () => {
    document.body.innerHTML = mockBody.convertVariableText;
    expect(await convertVariableText()).toBe(null);
    expect(mockClearSelection).not.toHaveBeenCalled();
    expect(mockClear).not.toHaveBeenCalled();
  });

  test('removeVariableText', () => {
    document.body.innerHTML = mockBody.removeVariableText;
    expect(removeVariableText()).toBe(null);
    expect(mockClearSelection).not.toHaveBeenCalled();
    expect(mockClear).not.toHaveBeenCalled();
  });

  test('extractVariableText', () => {
    document.body.innerHTML = mockBody.extractVariableText;
    expect(extractVariableText()).toBe(null);
    expect(mockClearSelection).not.toHaveBeenCalled();
    expect(mockClear).not.toHaveBeenCalled();
  });
});
