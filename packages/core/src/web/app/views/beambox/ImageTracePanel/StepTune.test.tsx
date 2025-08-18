import React from 'react';

import { act, fireEvent, render } from '@testing-library/react';

import StepTune from './StepTune';

const mockImageData = jest.fn();

jest.mock(
  '@core/helpers/image-data',
  () =>
    (...args) =>
      mockImageData(...args),
);

const mockInsertImage = jest.fn();

jest.mock('@core/app/actions/beambox/svgeditor-function-wrapper', () => ({
  insertImage: (...args) => mockInsertImage(...args),
}));

const mockGetCoordinates = jest.fn();

jest.mock('@core/app/actions/beambox/preview-mode-background-drawer', () => ({
  getCoordinates: () => mockGetCoordinates(),
}));

const mockTraceAndImportPath = jest.fn();

jest.mock(
  '@core/helpers/image-trace-panel/trace-and-import-path',
  () =>
    (...args) =>
      mockTraceAndImportPath(...args),
);

const mockOnGoBack = jest.fn();
const mockOnClose = jest.fn();

const mockCropData = {
  height: 100,
  rotate: 0,
  scaleX: 1,
  scaleY: 1,
  width: 100,
  x: 10,
  y: 10,
};

describe('test StepTune', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should render correctly', () => {
    const { baseElement } = render(
      <StepTune cropData={mockCropData} imageUrl="mock-url" onClose={mockOnClose} onGoBack={mockOnGoBack} />,
    );

    expect(baseElement).toMatchSnapshot();

    expect(mockImageData).toHaveBeenCalledTimes(1);
    expect(mockImageData).toHaveBeenLastCalledWith('mock-url', expect.anything());

    const { onComplete } = mockImageData.mock.calls[0][1];

    act(() => onComplete({ pngBase64: 'mock-base64' }));
    expect(baseElement).toMatchSnapshot();
  });

  test('go back button should work', () => {
    const { getByText } = render(
      <StepTune cropData={mockCropData} imageUrl="mock-url" onClose={mockOnClose} onGoBack={mockOnGoBack} />,
    );

    expect(mockOnGoBack).not.toHaveBeenCalled();
    fireEvent.click(getByText('Back'));
    expect(mockOnGoBack).toHaveBeenCalledTimes(1);
  });

  test('ok button should work', async () => {
    const { getByText } = render(
      <StepTune cropData={mockCropData} imageUrl="mock-url" onClose={mockOnClose} onGoBack={mockOnGoBack} />,
    );

    expect(mockImageData).toHaveBeenCalledTimes(1);
    expect(mockImageData).toHaveBeenLastCalledWith('mock-url', expect.anything());

    const { onComplete } = mockImageData.mock.calls[0][1];

    act(() => onComplete({ pngBase64: 'mock-base64' }));
    expect(mockTraceAndImportPath).not.toHaveBeenCalled();
    expect(mockInsertImage).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
    mockGetCoordinates.mockReturnValue({ minX: 20, minY: 30 });
    await act(async () => {
      fireEvent.click(getByText('Next'));
    });
    expect(mockTraceAndImportPath).toHaveBeenCalledTimes(1);
    expect(mockTraceAndImportPath).toHaveBeenLastCalledWith('mock-base64', {
      height: 100,
      width: 100,
      x: 30,
      y: 40,
    });
    expect(mockInsertImage).toHaveBeenCalledTimes(1);
    expect(mockInsertImage).toHaveBeenLastCalledWith('mock-url', { height: 100, width: 100, x: 30, y: 40 }, 128);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
