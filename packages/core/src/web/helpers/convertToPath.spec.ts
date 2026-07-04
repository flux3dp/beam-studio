/* eslint-disable @typescript-eslint/no-explicit-any */
// Mock fns declared before jest.mock (hoisting makes this work).
const mockFontFuncsConvertTextToPath = jest.fn();

const mockHandleHistoryActionOptions = jest.fn();
const mockAddCommandToHistory = jest.fn();

const mockSelectOnly = jest.fn();
const mockUngroupTempGroup = jest.fn();
const mockMultiSelect = jest.fn();

const mockToSelectMode = jest.fn();

const mockRenderText = jest.fn();

const mockAlertPopUp = jest.fn();
const mockAlertConfigRead = jest.fn();
const mockAlertConfigWrite = jest.fn();

// svgCanvas methods
const mockConvertToPath = jest.fn();

// --- Real BatchCommand-like fake so unapply/isEmpty behavior is observable ---
class FakeBatchCommand {
  text: string;
  subCommands: any[] = [];
  unapply = jest.fn();

  constructor(text = '') {
    this.text = text;
  }

  addSubCommand = (cmd: any) => {
    this.subCommands.push(cmd);
  };

  isEmpty = () => this.subCommands.length === 0;
}

jest.mock('@core/app/actions/beambox/font-funcs', () => ({
  __esModule: true,
  ConvertResult: { CANCEL_OPERATION: 0, CONTINUE: 2, UNSUPPORT: 1 },
  default: {
    convertTextToPath: (...args: any[]) => mockFontFuncsConvertTextToPath(...args),
  },
}));

jest.mock('@core/app/svgedit/history/history', () => ({
  __esModule: true,
  BatchCommand: FakeBatchCommand,
  default: { BatchCommand: FakeBatchCommand, InsertElementCommand: class {} },
}));

jest.mock('@core/app/svgedit/history/undoManager', () => ({
  __esModule: true,
  default: { addCommandToHistory: (...args: any[]) => mockAddCommandToHistory(...args) },
}));

jest.mock('@core/app/svgedit/history/utils/handleHistoryActionOptions', () => ({
  handleHistoryActionOptions: (...args: any[]) => mockHandleHistoryActionOptions(...args),
}));

jest.mock('@core/app/svgedit/operations/delete', () => ({
  deleteElements: jest.fn(() => ({ type: 'delete-cmd' })),
}));

jest.mock('@core/app/svgedit/operations/disassembleUse', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@core/app/svgedit/selection', () => ({
  __esModule: true,
  default: {
    clearSelection: jest.fn(),
    getSelectedElements: jest.fn(() => []),
    multiSelect: (...args: any[]) => mockMultiSelect(...args),
    selectOnly: (...args: any[]) => mockSelectOnly(...args),
    ungroupTempGroup: (...args: any[]) => mockUngroupTempGroup(...args),
  },
}));

jest.mock('@core/app/svgedit/text/textactions', () => ({
  __esModule: true,
  default: {
    get isEditing() {
      return mockIsEditing.value;
    },
    toSelectMode: (...args: any[]) => mockToSelectMode(...args),
  },
}));

const mockIsEditing = { value: false };

jest.mock('@core/app/svgedit/text/textedit', () => ({
  __esModule: true,
  default: { renderText: (...args: any[]) => mockRenderText(...args) },
}));

jest.mock('@core/app/actions/alert-caller', () => ({
  __esModule: true,
  default: { popUp: (...args: any[]) => mockAlertPopUp(...args) },
}));

jest.mock('./api/alert-config', () => ({
  __esModule: true,
  default: {
    read: (...args: any[]) => mockAlertConfigRead(...args),
    write: (...args: any[]) => mockAlertConfigWrite(...args),
  },
}));

jest.mock('./svg-editor-helper', () => ({
  getSVGAsync: (cb: any) =>
    cb({
      Canvas: {
        convertToPath: (...args: any[]) => mockConvertToPath(...args),
      },
      Edit: { utilities: { getRotationAngle: jest.fn(() => 0) } },
    }),
}));

import { ConvertResult } from '@core/app/actions/beambox/font-funcs';

import { convertAllTextToPath, convertSvgToPath, convertTextToPath } from './convertToPath';

// jsdom lacks SVG geometry APIs (Gotcha 10): stub getBBox on the prototype.
const fakeBBox = { height: 10, width: 20, x: 1, y: 2 } as DOMRect;

beforeAll(() => {
  (SVGElement.prototype as any).getBBox = jest.fn(() => fakeBBox);
});

const makeText = (): SVGElement => document.createElementNS('http://www.w3.org/2000/svg', 'text');
const makePath = (d = 'M0 0 L10 10'): SVGPathElement => {
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path') as SVGPathElement;

  p.setAttribute('d', d);

  return p;
};

describe('convertToPath', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsEditing.value = false;
    document.body.innerHTML = '';
  });

  describe('convertSvgToPath', () => {
    test('converts an element and returns the created path with its bbox', () => {
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'rect') as unknown as SVGElement;
      const path = makePath();
      const cmd = { type: 'convert-cmd' };

      mockConvertToPath.mockReturnValue({ cmd, path });

      const result = convertSvgToPath(el);

      expect(mockConvertToPath).toHaveBeenCalledWith(el, true);
      expect(result.path).toBe(path);
      expect(result.command).toBe(cmd);
      expect(result.bbox).toEqual(fakeBBox);
      // Not asked to select, so selection is untouched.
      expect(mockSelectOnly).not.toHaveBeenCalled();
      // History handling delegated with default options.
      expect(mockHandleHistoryActionOptions).toHaveBeenCalledWith(cmd, {});
    });

    test('selects the resulting path when isToSelect is true and honors parentCmd', () => {
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'rect') as unknown as SVGElement;
      const path = makePath();
      const cmd = { type: 'convert-cmd' };
      const parentCmd = new FakeBatchCommand('parent');

      mockConvertToPath.mockReturnValue({ cmd, path });

      const result = convertSvgToPath(el, { isToSelect: true, parentCmd: parentCmd as any });

      expect(mockSelectOnly).toHaveBeenCalledWith([path]);
      expect(mockHandleHistoryActionOptions).toHaveBeenCalledWith(cmd, { parentCmd });
      // When parentCmd is provided, it is returned as the command.
      expect(result.command).toBe(parentCmd);
    });
  });

  describe('convertTextToPath', () => {
    test('exits text-edit mode, delegates to font-funcs, and returns the path/status', async () => {
      mockIsEditing.value = true;

      const text = makeText();
      const path = makePath();
      const command = new FakeBatchCommand('font-cmd');

      mockFontFuncsConvertTextToPath.mockResolvedValue({
        command,
        path,
        status: ConvertResult.CONTINUE,
      });

      const result = await convertTextToPath(text, { pathPerChar: true, weldingTexts: true });

      // Editing session is closed before conversion.
      expect(mockToSelectMode).toHaveBeenCalledTimes(1);
      // Options forwarded to the font layer (always isSubCommand).
      expect(mockFontFuncsConvertTextToPath).toHaveBeenCalledWith(text, {
        isSubCommand: true,
        pathPerChar: true,
        weldingTexts: true,
      });
      expect(result.path).toBe(path);
      expect(result.command).toBe(command);
      expect(result.status).toBe(ConvertResult.CONTINUE);
      expect(result.bbox).toEqual(fakeBBox);
      expect(mockHandleHistoryActionOptions).toHaveBeenCalledWith(command, {});
    });

    test('does not enter select mode when not editing, and selects when requested', async () => {
      mockIsEditing.value = false;

      const text = makeText();
      const path = makePath();
      const command = new FakeBatchCommand('font-cmd');

      mockFontFuncsConvertTextToPath.mockResolvedValue({
        command,
        path,
        status: ConvertResult.CONTINUE,
      });

      await convertTextToPath(text, { isToSelect: true });

      expect(mockToSelectMode).not.toHaveBeenCalled();
      expect(mockSelectOnly).toHaveBeenCalledWith([path]);
    });

    test('handles a null result (unsupported/cancelled font) without touching history or selection', async () => {
      const text = makeText();

      mockFontFuncsConvertTextToPath.mockResolvedValue({
        command: null,
        path: null,
        status: ConvertResult.UNSUPPORT,
      });

      const result = await convertTextToPath(text, { isToSelect: true });

      // No command -> handleHistoryActionOptions is not called.
      expect(mockHandleHistoryActionOptions).not.toHaveBeenCalled();
      // No path -> nothing selected.
      expect(mockSelectOnly).not.toHaveBeenCalled();
      expect(result.path).toBeUndefined();
      expect(result.command).toBeUndefined();
      expect(result.status).toBe(ConvertResult.UNSUPPORT);
    });
  });

  describe('convertAllTextToPath', () => {
    const seedCanvasWithTexts = (count: number) => {
      const svgcontent = document.createElement('div');

      svgcontent.id = 'svgcontent';

      const layer = document.createElementNS('http://www.w3.org/2000/svg', 'g');

      layer.setAttribute('class', 'layer');

      for (let i = 0; i < count; i += 1) {
        layer.appendChild(makeText());
      }

      svgcontent.appendChild(layer);
      document.body.appendChild(svgcontent);
    };

    test('converts every visible text element and reports success', async () => {
      seedCanvasWithTexts(3);
      mockAlertConfigRead.mockReturnValue(false);

      mockFontFuncsConvertTextToPath.mockResolvedValue({
        command: new FakeBatchCommand('c'),
        path: makePath(),
        status: ConvertResult.CONTINUE,
      });

      const { revert, success } = await convertAllTextToPath();

      expect(success).toBe(true);
      expect(mockFontFuncsConvertTextToPath).toHaveBeenCalledTimes(3);
      // All conversions recorded under a single parent batch command.
      const parentCmds = mockHandleHistoryActionOptions.mock.calls.map((c) => c[1].parentCmd);

      expect(parentCmds.every((c) => c === parentCmds[0])).toBe(true);
      expect(parentCmds[0]).toBeInstanceOf(FakeBatchCommand);
      // No unsupported font -> no thumbnail warning popup.
      expect(mockAlertPopUp).not.toHaveBeenCalled();
      expect(typeof revert).toBe('function');
    });

    test('revert unapplies the master batch command with textedit.renderText', async () => {
      seedCanvasWithTexts(1);
      mockAlertConfigRead.mockReturnValue(true);

      const command = new FakeBatchCommand('c');

      mockFontFuncsConvertTextToPath.mockResolvedValue({
        command,
        path: makePath(),
        status: ConvertResult.CONTINUE,
      });

      const { revert } = await convertAllTextToPath();

      // The parent batch command passed to history handling is the one revert() unapplies.
      const parentCmd = mockHandleHistoryActionOptions.mock.calls[0][1].parentCmd as FakeBatchCommand;

      revert();

      expect(parentCmd.unapply).toHaveBeenCalledTimes(1);
      const handler = parentCmd.unapply.mock.calls[0][0];

      expect(typeof handler.renderText).toBe('function');
      // The handler's renderText delegates to textedit.renderText.
      handler.renderText('a', 'b');
      expect(mockRenderText).toHaveBeenCalledWith('a', 'b');
    });

    test('bails out early with success=false when a conversion is cancelled', async () => {
      seedCanvasWithTexts(3);

      mockFontFuncsConvertTextToPath
        .mockResolvedValueOnce({
          command: new FakeBatchCommand('c'),
          path: makePath(),
          status: ConvertResult.CONTINUE,
        })
        .mockResolvedValueOnce({
          command: null,
          path: null,
          status: ConvertResult.CANCEL_OPERATION,
        });

      const { revert, success } = await convertAllTextToPath();

      expect(success).toBe(false);
      // Stops at the cancelled element; the third text is never processed.
      expect(mockFontFuncsConvertTextToPath).toHaveBeenCalledTimes(2);
      // Revert is a no-op on the cancel path (nothing to undo).
      expect(() => revert()).not.toThrow();
    });

    test('shows the font-substitution thumbnail warning when a font is unsupported and not skipped', async () => {
      seedCanvasWithTexts(1);
      mockAlertConfigRead.mockReturnValue(false);

      mockFontFuncsConvertTextToPath.mockResolvedValue({
        command: new FakeBatchCommand('c'),
        path: makePath(),
        status: ConvertResult.UNSUPPORT,
      });

      // Auto-resolve the popup by invoking the primary callback.
      mockAlertPopUp.mockImplementation(({ callbacks }: any) => callbacks());

      const { success } = await convertAllTextToPath();

      expect(success).toBe(true);
      expect(mockAlertConfigRead).toHaveBeenCalledWith('skip_check_thumbnail_warning');
      expect(mockAlertPopUp).toHaveBeenCalledTimes(1);

      const popupArg = mockAlertPopUp.mock.calls[0][0];

      // The "don't show again" checkbox persists the skip flag.
      popupArg.checkbox.callbacks();
      expect(mockAlertConfigWrite).toHaveBeenCalledWith('skip_check_thumbnail_warning', true);
    });

    test('suppresses the warning when skip_check_thumbnail_warning is already set', async () => {
      seedCanvasWithTexts(1);
      mockAlertConfigRead.mockReturnValue(true);

      mockFontFuncsConvertTextToPath.mockResolvedValue({
        command: new FakeBatchCommand('c'),
        path: makePath(),
        status: ConvertResult.UNSUPPORT,
      });

      const { success } = await convertAllTextToPath();

      expect(success).toBe(true);
      expect(mockAlertPopUp).not.toHaveBeenCalled();
    });
  });
});
