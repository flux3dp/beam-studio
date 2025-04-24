import type { IBatchCommand } from '@core/interfaces/IHistory';

const mockDisassembleUse = jest.fn();

jest.mock('@core/app/svgedit/operations/disassembleUse', () => mockDisassembleUse);

const mockUpdateElementColor = jest.fn();

jest.mock('@core/helpers/color/updateElementColor', () => mockUpdateElementColor);

const mockCmd = 'mock-cmd';
const mockGetSvgRealLocation = jest.fn().mockReturnValue({ height: 25, width: 15, x: 15, y: 10 });
const mockSelectOnly = jest.fn();
const mockSetSvgElemPosition = jest.fn().mockReturnValue(mockCmd);
const mockSetSvgElemSize = jest.fn().mockReturnValue(mockCmd);
const mockGetSelectedElems = jest.fn().mockReturnValue(['mock-path-elem']);

jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync: (callback) =>
    callback({
      Canvas: {
        getSelectedElems: () => mockGetSelectedElems(),
        getSvgRealLocation: (...args: any) => mockGetSvgRealLocation(...args),
        selectOnly: (...args: any) => mockSelectOnly(...args),
        setSvgElemPosition: (...args: any) => mockSetSvgElemPosition(...args),
        setSvgElemSize: (...args: any) => mockSetSvgElemSize(...args),
      },
    }),
}));

const mockElement = document.createElement('svg') as unknown as SVGElement;
const mockAddSubCommand = jest.fn();
const mockBatchCommand = { addSubCommand: mockAddSubCommand } as unknown as IBatchCommand;

import postImportElement from './postImportElement';

describe('test postImportElement', () => {
  it('should import svg object, update location and disassemble', async () => {
    await postImportElement(mockElement, mockBatchCommand);

    expect(mockGetSvgRealLocation).toHaveBeenCalledTimes(1);
    expect(mockGetSvgRealLocation).toHaveBeenCalledWith(mockElement);
    expect(mockSelectOnly).toHaveBeenCalledTimes(1);
    expect(mockSelectOnly).toHaveBeenCalledWith([mockElement]);
    expect(mockSetSvgElemPosition).toHaveBeenCalledTimes(2);
    expect(mockSetSvgElemPosition).toHaveBeenNthCalledWith(1, 'x', 0, mockElement, false);
    expect(mockSetSvgElemPosition).toHaveBeenNthCalledWith(2, 'y', 0, mockElement, false);
    expect(mockSetSvgElemSize).toHaveBeenCalledTimes(2);
    expect(mockSetSvgElemSize).toHaveBeenNthCalledWith(1, 'width', 300);
    expect(mockSetSvgElemSize).toHaveBeenNthCalledWith(2, 'height', 500);
    expect(mockAddSubCommand).toHaveBeenCalledTimes(4);
    expect(mockAddSubCommand).toHaveBeenCalledWith(mockCmd);
    expect(mockDisassembleUse).toHaveBeenCalledTimes(1);
    expect(mockDisassembleUse).toHaveBeenNthCalledWith(1, [mockElement], {
      parentCmd: mockBatchCommand,
      skipConfirm: true,
    });
    expect(mockUpdateElementColor).toHaveBeenCalledTimes(1);
    expect(mockUpdateElementColor).toHaveBeenCalledWith('mock-path-elem');
  });
});
