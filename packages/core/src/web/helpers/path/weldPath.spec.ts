import weldPath from './weldPath';

const mockImportSVG = jest.fn();
const mockExportSVG = jest.fn();

jest.mock('paper', () => ({
  Project: jest.fn().mockImplementation(() => ({
    exportSVG: mockExportSVG,
    importSVG: mockImportSVG,
  })),
}));

describe('test weldPath', () => {
  it('should work', () => {
    const mockUnite = jest.fn();
    const mockObjA = {
      area: 100,
      pathData: 'mock-data-1',
      remove: jest.fn(),
      reverse: jest.fn(),
      unite: mockUnite,
    };
    const mockObjB = {
      area: -20,
      pathData: 'mock-data-2',
      remove: jest.fn(),
      reverse: jest.fn(),
      unite: mockUnite,
    };
    const mockObjC = {
      area: 100,
      pathData: 'mock-data-1',
      remove: jest.fn(),
      reverse: jest.fn(),
      unite: mockUnite,
    };
    const pathD = 'M123 234 L 345 456 L567 678z M123 345 L 567 789 L 123 456';

    mockImportSVG.mockReturnValue({ children: [mockObjA, mockObjB, mockObjC] });
    mockUnite.mockReturnValueOnce(mockObjC).mockReturnValueOnce(mockObjB);

    const mockGetAttribute = jest.fn();

    mockExportSVG.mockReturnValue({
      children: [
        // svg
        {
          children: [
            // canvas
            {
              children: [
                // results
                { getAttribute: mockGetAttribute },
                { getAttribute: mockGetAttribute },
                { getAttribute: mockGetAttribute },
              ],
            },
          ],
        },
      ],
    });
    mockGetAttribute
      .mockReturnValueOnce('mock-path-1,')
      .mockReturnValueOnce('mock-path-2,')
      .mockReturnValueOnce('mock-path-3,');

    const res = weldPath(pathD);

    expect(mockImportSVG).toHaveBeenCalledTimes(1);
    expect(mockUnite).toHaveBeenCalledTimes(2);
    // sorted by area
    expect(mockUnite).toHaveBeenNthCalledWith(1, mockObjC);
    expect(mockUnite).toHaveBeenNthCalledWith(2, mockObjB);
    expect(mockObjA.remove).toHaveBeenCalledTimes(1);
    expect(mockObjB.remove).toHaveBeenCalledTimes(1);
    expect(mockObjC.remove).toHaveBeenCalledTimes(1);
    expect(mockObjA.reverse).not.toHaveBeenCalled();
    expect(mockObjB.reverse).not.toHaveBeenCalled();
    expect(mockObjC.reverse).toHaveBeenCalledTimes(1);
    expect(mockGetAttribute).toHaveBeenCalledTimes(3);
    expect(res).toEqual('mock-path-1,mock-path-2,mock-path-3,');
  });
});
