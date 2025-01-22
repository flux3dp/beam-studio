import traceAndImportPath from './trace-and-import-path';

const mockAddSvgElementFromJson = jest.fn();
const mockGetNextId = jest.fn();
const mockSelectOnly = jest.fn();
const mockSetSvgElemSize = jest.fn();
const mockAddCommandToHistory = jest.fn();

jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync: (callback) =>
    callback({
      Canvas: {
        addSvgElementFromJson: (...args) => mockAddSvgElementFromJson(...args),
        getNextId: (...args) => mockGetNextId(...args),
        handleGenerateSensorArea: 'mock-handleGenerateSensorArea',
        selectOnly: (...args) => mockSelectOnly(...args),
        setSvgElemSize: (...args) => mockSetSvgElemSize(...args),
        undoMgr: {
          addCommandToHistory: (...args) => mockAddCommandToHistory(...args),
        },
      },
    }),
}));

const mockMoveElements = jest.fn();

jest.mock('@core/app/svgedit/operations/move', () => ({
  moveElements: (...args) => mockMoveElements(...args),
}));

const mockRequirejsHelper = jest.fn();

jest.mock(
  '@core/helpers/requirejs-helper',
  () =>
    (...args) =>
      mockRequirejsHelper(...args),
);

const mockAddSubCommand = jest.fn();
const mockInsertElementCommand = jest.fn();
const mockBatchCommand = jest.fn();

mockBatchCommand.mockImplementation(() => ({
  addSubCommand: mockAddSubCommand,
}));
jest.mock('@core/app/svgedit/history/history', () => ({
  BatchCommand: function BatchCommand(...args) {
    return mockBatchCommand(...args);
  },
  InsertElementCommand: function InsertElementCommand(...args) {
    return mockInsertElementCommand(...args);
  },
}));

const mockImageTracer = {
  appendSVGString: jest.fn(),
  imageToSVG: jest.fn(),
};

describe('test traceAndImportPath', () => {
  it('should work', async () => {
    mockRequirejsHelper.mockResolvedValueOnce(mockImageTracer);

    const promise = traceAndImportPath('mock-base64', { height: 4, width: 3, x: 1, y: 2 });

    expect(mockRequirejsHelper).toBeCalledTimes(1);
    expect(mockRequirejsHelper).toHaveBeenLastCalledWith('imagetracer');
    await new Promise((r) => setTimeout(r));
    expect(mockImageTracer.imageToSVG).toBeCalledTimes(1);
    expect(mockImageTracer.imageToSVG).toHaveBeenLastCalledWith('mock-base64', expect.anything());

    const [, callback] = mockImageTracer.imageToSVG.mock.calls[0];

    expect(mockGetNextId).not.toBeCalled();
    mockGetNextId.mockReturnValueOnce('svg-1');
    mockGetNextId.mockReturnValueOnce('svg-2');
    expect(mockInsertElementCommand).not.toBeCalled();
    mockInsertElementCommand.mockImplementation(() => ({ id: 'mock-insert-element-cmd' }));

    const mockG = {
      childNodes: [],
      getBBox: jest.fn(),
      remove: jest.fn(),
    };

    mockG.getBBox.mockReturnValue({ height: 6, width: 5 });
    mockAddSvgElementFromJson.mockReturnValueOnce(mockG);

    const mockPath = {
      addEventListener: jest.fn(),
      setAttribute: jest.fn(),
    };

    mockAddSvgElementFromJson.mockReturnValueOnce(mockPath);
    callback('mock-svg-str');
    expect(mockBatchCommand).toBeCalledTimes(1);
    expect(mockBatchCommand).toHaveBeenLastCalledWith('Add Image Trace');
    expect(mockGetNextId).toBeCalledTimes(2);
    expect(mockAddSvgElementFromJson).toBeCalledTimes(2);
    expect(mockAddSvgElementFromJson).toHaveBeenNthCalledWith(1, {
      attr: { id: 'svg-1' },
      element: 'g',
    });
    expect(mockAddSvgElementFromJson).toHaveBeenNthCalledWith(2, {
      attr: {
        fill: '#000000',
        id: 'svg-2',
        'stroke-width': 1,
        'vector-effect': 'non-scaling-stroke',
      },
      element: 'path',
    });
    expect(mockPath.addEventListener).toBeCalledTimes(2);
    expect(mockPath.addEventListener).toHaveBeenNthCalledWith(1, 'mouseover', 'mock-handleGenerateSensorArea');
    expect(mockPath.addEventListener).toHaveBeenNthCalledWith(2, 'mouseleave', 'mock-handleGenerateSensorArea');
    expect(mockInsertElementCommand).toBeCalledTimes(1);
    expect(mockAddSubCommand).toBeCalledTimes(1);
    expect(mockAddSubCommand).toHaveBeenLastCalledWith({ id: 'mock-insert-element-cmd' });
    expect(mockImageTracer.appendSVGString).toBeCalledTimes(1);
    expect(mockImageTracer.appendSVGString).toHaveBeenLastCalledWith('mock-svg-str', 'svg-1');
    expect(mockG.getBBox).toBeCalledTimes(1);
    expect(mockSetSvgElemSize).toBeCalledTimes(2);
    expect(mockSetSvgElemSize).toHaveBeenNthCalledWith(1, 'width', 3);
    expect(mockSetSvgElemSize).toHaveBeenNthCalledWith(2, 'height', 4);
    expect(mockG.remove).toBeCalledTimes(1);
    expect(mockPath.setAttribute).toBeCalledTimes(1);
    expect(mockPath.setAttribute).toHaveBeenLastCalledWith('d', '');
    expect(mockMoveElements).toBeCalledTimes(1);
    expect(mockMoveElements).toHaveBeenLastCalledWith([1], [2], [mockPath], false);
    expect(mockSelectOnly).toBeCalledTimes(2);
    expect(mockSelectOnly).toHaveBeenNthCalledWith(1, [mockG]);
    expect(mockSelectOnly).toHaveBeenNthCalledWith(2, [mockPath], true);
    expect(mockAddCommandToHistory).toBeCalledTimes(1);
    expect(await promise).toBeTruthy();
  });
});
