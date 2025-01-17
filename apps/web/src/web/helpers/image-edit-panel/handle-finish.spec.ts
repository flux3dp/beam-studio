import handleFinish from './handle-finish';


const mockSelectOnly = jest.fn();
jest.mock('helpers/svg-editor-helper', () => ({
  getSVGAsync: (callback) => callback({
    Canvas: {
      selectOnly: (...args) => mockSelectOnly(...args),
    },
  }),
}));

const mockAddBatchCommand = jest.fn();
jest.mock('helpers/image-edit', () => ({
  addBatchCommand: (...args) => mockAddBatchCommand(...args),
}));

describe('test image-edit-panel/handle-finish', () => {
  it('should work', () => {
    const mockElement = {
      setAttribute: jest.fn(),
    };
    handleFinish(mockElement as unknown as SVGImageElement, 'mock-src', 'mock-base64', { width: 100, height: 200 });
    expect(mockAddBatchCommand).toBeCalledTimes(1);
    expect(mockAddBatchCommand).toHaveBeenLastCalledWith('Image Edit', mockElement, {
      origImage: 'mock-src',
      'xlink:href': 'mock-base64',
      width: 100,
      height: 200,
    });
    expect(mockSelectOnly).toBeCalledTimes(1);
    expect(mockSelectOnly).toHaveBeenLastCalledWith([mockElement], true);
  });
});
