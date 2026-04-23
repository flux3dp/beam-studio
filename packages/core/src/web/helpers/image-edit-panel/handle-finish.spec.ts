const mockSelectOnly = jest.fn();

jest.mock('@core/app/svgedit/selection', () => ({
  selectOnly: mockSelectOnly,
}));

const mockAddBatchCommand = jest.fn();

jest.mock('@core/helpers/image-edit', () => ({
  addBatchCommand: mockAddBatchCommand,
}));

import handleFinish from './handle-finish';

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
