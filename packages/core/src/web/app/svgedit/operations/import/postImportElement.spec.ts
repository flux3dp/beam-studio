import type { IBatchCommand } from '@core/interfaces/IHistory';

const mockGetBBox = jest.fn().mockReturnValue({ height: 25, width: 15, x: 15, y: 10 });

jest.mock('../../utils/getBBox', () => ({
  getBBox: (elem: SVGElement) => mockGetBBox(elem),
}));

const mockDisassembleUse = jest.fn();

jest.mock('@core/app/svgedit/operations/disassembleUse', () => mockDisassembleUse);

const mockUpdateElementColor = jest.fn();

jest.mock('@core/helpers/color/updateElementColor', () => mockUpdateElementColor);

const mockCmd1 = 'mock-cmd-1';
const mockCmd2 = 'mock-cmd-2';
const mockCmd3 = 'mock-cmd-3';
const mockSelectOnly = jest.fn();
const mockSetSvgElemSize = jest.fn().mockReturnValue(mockCmd1);
const mockSetSvgElemPosition = jest.fn().mockReturnValue(mockCmd2);
const mockGetSelectedElems = jest.fn();
const mockGroupSelectedElements = jest.fn().mockReturnValue({ command: mockCmd3 });

jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync: (callback) =>
    callback({
      Canvas: {
        getSelectedElems: mockGetSelectedElems,
        groupSelectedElements: mockGroupSelectedElements,
        selectOnly: mockSelectOnly,
        setSvgElemPosition: mockSetSvgElemPosition,
        setSvgElemSize: mockSetSvgElemSize,
      },
    }),
}));

let mockPathElement: SVGElement;
const mockElement = document.createElement('svg') as unknown as SVGElement;
const mockAddSubCommand = jest.fn();
const mockBatchCommand = { addSubCommand: mockAddSubCommand } as unknown as IBatchCommand;

import postImportElement from './postImportElement';

describe('test postImportElement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathElement = document.createElement('path') as unknown as SVGElement;
    mockGetSelectedElems.mockReturnValue([mockPathElement]);
  });

  it('should import svg object, update location and disassemble', async () => {
    await postImportElement(mockElement, mockBatchCommand);

    expect(mockGetBBox).toHaveBeenCalledTimes(1);
    expect(mockGetBBox).toHaveBeenCalledWith(mockElement);
    expect(mockSelectOnly).toHaveBeenCalledTimes(1);
    expect(mockSelectOnly).toHaveBeenCalledWith([mockElement]);
    expect(mockSetSvgElemPosition).toHaveBeenCalledTimes(2);
    expect(mockSetSvgElemPosition).toHaveBeenNthCalledWith(1, 'x', 0, mockElement, false);
    expect(mockSetSvgElemPosition).toHaveBeenNthCalledWith(2, 'y', 0, mockElement, false);
    expect(mockSetSvgElemSize).toHaveBeenCalledTimes(2);
    expect(mockSetSvgElemSize).toHaveBeenNthCalledWith(1, 'width', 300);
    expect(mockSetSvgElemSize).toHaveBeenNthCalledWith(2, 'height', 500);
    expect(mockAddSubCommand).toHaveBeenCalledTimes(4);
    expect(mockAddSubCommand).toHaveBeenNthCalledWith(1, mockCmd1);
    expect(mockAddSubCommand).toHaveBeenNthCalledWith(2, mockCmd1);
    expect(mockAddSubCommand).toHaveBeenNthCalledWith(3, mockCmd2);
    expect(mockAddSubCommand).toHaveBeenNthCalledWith(4, mockCmd2);
    expect(mockDisassembleUse).toHaveBeenCalledTimes(1);
    expect(mockDisassembleUse).toHaveBeenNthCalledWith(1, [mockElement], {
      parentCmd: mockBatchCommand,
      skipConfirm: true,
    });
    expect(mockUpdateElementColor).toHaveBeenCalledTimes(1);
    expect(mockUpdateElementColor).toHaveBeenCalledWith(mockPathElement);
    expect(mockGroupSelectedElements).not.toHaveBeenCalled();
  });

  it('should group elements correctly', async () => {
    mockPathElement.setAttribute('data-tempgroup', 'true');
    await postImportElement(mockElement, mockBatchCommand);

    expect(mockGetBBox).toHaveBeenCalledTimes(1);
    expect(mockGetBBox).toHaveBeenCalledWith(mockElement);
    expect(mockSelectOnly).toHaveBeenCalledTimes(1);
    expect(mockSelectOnly).toHaveBeenCalledWith([mockElement]);
    expect(mockSetSvgElemPosition).toHaveBeenCalledTimes(2);
    expect(mockSetSvgElemPosition).toHaveBeenNthCalledWith(1, 'x', 0, mockElement, false);
    expect(mockSetSvgElemPosition).toHaveBeenNthCalledWith(2, 'y', 0, mockElement, false);
    expect(mockSetSvgElemSize).toHaveBeenCalledTimes(2);
    expect(mockSetSvgElemSize).toHaveBeenNthCalledWith(1, 'width', 300);
    expect(mockSetSvgElemSize).toHaveBeenNthCalledWith(2, 'height', 500);
    expect(mockAddSubCommand).toHaveBeenCalledTimes(5);
    expect(mockAddSubCommand).toHaveBeenNthCalledWith(1, mockCmd1);
    expect(mockAddSubCommand).toHaveBeenNthCalledWith(2, mockCmd1);
    expect(mockAddSubCommand).toHaveBeenNthCalledWith(3, mockCmd2);
    expect(mockAddSubCommand).toHaveBeenNthCalledWith(4, mockCmd2);
    expect(mockDisassembleUse).toHaveBeenCalledTimes(1);
    expect(mockDisassembleUse).toHaveBeenNthCalledWith(1, [mockElement], {
      parentCmd: mockBatchCommand,
      skipConfirm: true,
    });
    expect(mockGroupSelectedElements).toHaveBeenCalledTimes(1);
    expect(mockAddSubCommand).toHaveBeenNthCalledWith(5, mockCmd3);
    expect(mockUpdateElementColor).toHaveBeenCalledTimes(1);
    expect(mockUpdateElementColor).toHaveBeenCalledWith(mockPathElement);
  });
});
