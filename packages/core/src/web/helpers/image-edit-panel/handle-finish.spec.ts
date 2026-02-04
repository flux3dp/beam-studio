import handleFinish from './handle-finish';

const mockSelectOnly = jest.fn();

jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync: (callback) =>
    callback({
      Canvas: {
        selectOnly: (...args) => mockSelectOnly(...args),
      },
    }),
}));

const mockAddBatchCommand = jest.fn();

jest.mock('@core/helpers/image-edit', () => ({
  addBatchCommand: (...args) => mockAddBatchCommand(...args),
}));

describe('test image-edit-panel/handle-finish', () => {
  it('should work', () => {
    const mockElement = {
      setAttribute: jest.fn(),
    };

    handleFinish(mockElement as unknown as SVGImageElement, 'mock-src', 'mock-base64', {
      height: 200,
      width: 100,
    });
    expect(mockAddBatchCommand).toHaveBeenCalledTimes(1);
    expect(mockAddBatchCommand).toHaveBeenLastCalledWith('Image Edit', mockElement, {
      height: 200,
      origImage: 'mock-src',
      width: 100,
      'xlink:href': 'mock-base64',
    });
    expect(mockSelectOnly).toHaveBeenCalledTimes(1);
    expect(mockSelectOnly).toHaveBeenLastCalledWith([mockElement], true);
  });
});
