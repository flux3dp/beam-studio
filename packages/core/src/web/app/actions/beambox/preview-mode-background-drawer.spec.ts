const mockSetBackgroundImage = jest.fn();

jest.mock('@core/app/svgedit/canvasBackground', () => ({
  clearBackgroundImage: jest.fn(),
  getBackgroundUrl: jest.fn(),
  setBackgroundImage: (...args) => mockSetBackgroundImage(...args),
}));
jest.mock('@core/app/stores/cameraPreview', () => ({ setCameraPreviewState: jest.fn() }));
jest.mock('@core/app/svgedit/workarea', () => ({ model: 'fbm2', modelHeight: 10, width: 10 }));
jest.mock('@core/helpers/svg-editor-helper', () => ({ getSVGAsync: jest.fn() }));

import previewModeBackgroundDrawer from './preview-mode-background-drawer';

describe('drawFullWorkarea', () => {
  beforeAll(() => {
    URL.createObjectURL = jest.fn(() => 'blob:background');
    URL.revokeObjectURL = jest.fn();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(previewModeBackgroundDrawer, 'preprocessFullWorkareaImg').mockResolvedValue(new Blob(['x']));
    jest.spyOn(previewModeBackgroundDrawer, 'resetBoundary').mockImplementation(() => {});
  });

  test.each([
    ['before any preview session', () => {}],
    [
      'after a preview session ended',
      () => {
        previewModeBackgroundDrawer.start();
        previewModeBackgroundDrawer.end();
      },
    ],
  ])('draws %s (auto full-area preview)', async (_, arrange) => {
    arrange();
    await previewModeBackgroundDrawer.drawFullWorkarea('blob:photo');
    expect(mockSetBackgroundImage).toHaveBeenCalledTimes(1);
  });

  test('draws through the session stream while a preview session is open', async () => {
    previewModeBackgroundDrawer.start();
    await previewModeBackgroundDrawer.drawFullWorkarea('blob:photo');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockSetBackgroundImage).toHaveBeenCalledTimes(1);
    previewModeBackgroundDrawer.end();
  });
});
