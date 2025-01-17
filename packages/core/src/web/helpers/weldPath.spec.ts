import weldPath from './weldPath';

const mockImportSVG = jest.fn();
const mockExportSVG = jest.fn();
jest.mock('paper', () => ({
  Project: jest.fn().mockImplementation(() => ({
    importSVG: mockImportSVG,
    exportSVG: mockExportSVG,
  })),
}));

describe('test weldPath', () => {
  it('should work', () => {
    const mockUnite = jest.fn();
    const mockObjA = {
      area: 100,
      remove: jest.fn(),
      unite: mockUnite,
      pathData: 'mock-data-1',
      reverse: jest.fn(),
    };
    const mockObjB = {
      area: -20,
      remove: jest.fn(),
      unite: mockUnite,
      pathData: 'mock-data-2',
      reverse: jest.fn(),
    };
    const mockObjC = {
      area: 100,
      remove: jest.fn(),
      unite: mockUnite,
      pathData: 'mock-data-1',
      reverse: jest.fn(),
    };
    const pathD = 'M123 234 L 345 456 L567 678z M123 345 L 567 789 L 123 456';
    mockImportSVG.mockReturnValue({ children: [mockObjA, mockObjB, mockObjC] });
    mockUnite.mockReturnValueOnce(mockObjC).mockReturnValueOnce(mockObjB);
    const mockGetAttribute = jest.fn();
    mockExportSVG.mockReturnValue({
      children: [ // svg
        {
          children: [ // canvas
            {
              children: [ // results
                { getAttribute: mockGetAttribute },
                { getAttribute: mockGetAttribute },
                { getAttribute: mockGetAttribute },
              ],
            }
          ],
        },
      ],
    });
    mockGetAttribute
      .mockReturnValueOnce('mock-path-1,')
      .mockReturnValueOnce('mock-path-2,')
      .mockReturnValueOnce('mock-path-3,');
    const res = weldPath(pathD);
    expect(mockImportSVG).toBeCalledTimes(1);
    expect(mockUnite).toBeCalledTimes(2);
    // sorted by area
    expect(mockUnite).toHaveBeenNthCalledWith(1, mockObjC);
    expect(mockUnite).toHaveBeenNthCalledWith(2, mockObjB);
    expect(mockObjA.remove).toBeCalledTimes(1);
    expect(mockObjB.remove).toBeCalledTimes(1);
    expect(mockObjC.remove).toBeCalledTimes(1);
    expect(mockObjA.reverse).not.toBeCalled();
    expect(mockObjB.reverse).not.toBeCalled();
    expect(mockObjC.reverse).toBeCalledTimes(1);
    expect(mockGetAttribute).toBeCalledTimes(3);
    expect(res).toEqual('mock-path-1,mock-path-2,mock-path-3,');
  });
});
