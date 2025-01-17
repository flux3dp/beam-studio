import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';

import StepTune from './StepTune';

const mockImageData = jest.fn();
jest.mock('helpers/image-data', () => (...args) => mockImageData(...args));

const mockInsertImage = jest.fn();
jest.mock('app/actions/beambox/svgeditor-function-wrapper', () => ({
  insertImage: (...args) => mockInsertImage(...args),
}));

jest.mock('helpers/i18n', () => ({
  lang: {
    beambox: {
      image_trace_panel: {
        cancel: 'cancel',
        back: 'back',
        next: 'next',
        tuning: 'tuning',
        threshold: 'threshold',
      },
    },
  },
}));

const mockGetCoordinates = jest.fn();
jest.mock('app/actions/beambox/preview-mode-background-drawer', () => ({
  getCoordinates: () => mockGetCoordinates(),
}));

const mockTraceAndImportPath = jest.fn();
jest.mock('helpers/image-trace-panel/trace-and-import-path', () => (...args) => mockTraceAndImportPath(...args));

const mockOnGoBack = jest.fn();
const mockOnClose = jest.fn();

const mockCropData = {
  x: 10,
  y: 10,
  width: 100,
  height: 100,
  rotate: 0,
  scaleX: 1,
  scaleY: 1,
};

describe('test StepTune', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should render correctly', () => {
    const { baseElement } = render(
      <StepTune
        imageUrl="mock-url"
        cropData={mockCropData}
        onGoBack={mockOnGoBack}
        onClose={mockOnClose}
      />
    );
    expect(baseElement).toMatchSnapshot();

    expect(mockImageData).toBeCalledTimes(1);
    expect(mockImageData).toHaveBeenLastCalledWith('mock-url', expect.anything());
    const { onComplete } = mockImageData.mock.calls[0][1];
    act(() => onComplete({ pngBase64: 'mock-base64' }));
    expect(baseElement).toMatchSnapshot();
  });

  test('go back button should work', () => {
    const { getByText } = render(
      <StepTune
        imageUrl="mock-url"
        cropData={mockCropData}
        onGoBack={mockOnGoBack}
        onClose={mockOnClose}
      />
    );
    expect(mockOnGoBack).not.toBeCalled();
    fireEvent.click(getByText('back'));
    expect(mockOnGoBack).toBeCalledTimes(1);
  });

  test('ok button should work', async () => {
    const { getByText } = render(
      <StepTune
        imageUrl="mock-url"
        cropData={mockCropData}
        onGoBack={mockOnGoBack}
        onClose={mockOnClose}
      />
    );
    expect(mockImageData).toBeCalledTimes(1);
    expect(mockImageData).toHaveBeenLastCalledWith('mock-url', expect.anything());
    const { onComplete } = mockImageData.mock.calls[0][1];
    act(() => onComplete({ pngBase64: 'mock-base64' }));
    expect(mockTraceAndImportPath).not.toBeCalled();
    expect(mockInsertImage).not.toBeCalled();
    expect(mockOnClose).not.toBeCalled();
    mockGetCoordinates.mockReturnValue({ minX: 20, minY: 30 });
    await act(async () => {
      fireEvent.click(getByText('next'));
    });
    expect(mockTraceAndImportPath).toBeCalledTimes(1);
    expect(mockTraceAndImportPath).toHaveBeenLastCalledWith('mock-base64', { x: 30, y: 40, width: 100, height: 100 });
    expect(mockInsertImage).toBeCalledTimes(1);
    expect(mockInsertImage).toHaveBeenLastCalledWith('mock-url', { x: 30, y: 40, width: 100, height: 100 }, 128);
    expect(mockOnClose).toBeCalledTimes(1);
  });
});
