import React from 'react';

import { act, fireEvent, render } from '@testing-library/react';

import ImageTracePanel from './ImageTracePanel';

const mockOnCropperShown = jest.fn();
const mockRemoveCropperShownListener = jest.fn();

jest.mock('@core/app/stores/beambox-store', () => ({
  onCropperShown: (...args) => mockOnCropperShown(...args),
  removeCropperShownListener: (...args) => mockRemoveCropperShownListener(...args),
}));

jest.mock('@core/app/views/beambox/ImageTracePanel/StepCrop', () => ({ onCancel, onCropFinish }: any) => (
  <div>
    Dummy StepCrop
    <button onClick={() => onCropFinish('mock-crop-data', 'mock-url')} type="button">
      finish
    </button>
    <button onClick={onCancel} type="button">
      cancel
    </button>
  </div>
));

jest.mock(
  '@core/app/views/beambox/ImageTracePanel/StepTune',
  () =>
    ({ cropData, imageUrl, onClose, onGoBack }: any) => (
      <div>
        Dummy StepTune
        <p>cropData: {cropData}</p>
        <p>imageUrl: {imageUrl}</p>
        <button onClick={onGoBack} type="button">
          back
        </button>
        <button onClick={onClose} type="button">
          close
        </button>
      </div>
    ),
);

describe('test ImageTracePanel', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should listen to beamboxstore events', () => {
    const { container, unmount } = render(<ImageTracePanel />);

    expect(container).toMatchSnapshot();
    expect(mockOnCropperShown).toBeCalledTimes(1);

    const [listener] = mockOnCropperShown.mock.calls[0];

    act(() => listener());
    expect(container).toMatchSnapshot();
    expect(mockRemoveCropperShownListener).not.toBeCalled();
    unmount();
    expect(mockRemoveCropperShownListener).toBeCalledTimes(1);
  });

  test('state transfer should work', () => {
    const { container, getByText } = render(<ImageTracePanel />);

    expect(mockOnCropperShown).toBeCalledTimes(1);

    const [listener] = mockOnCropperShown.mock.calls[0];

    act(() => listener());
    act(() => {
      fireEvent.click(getByText('finish'));
    });
    expect(container).toMatchSnapshot();
    act(() => {
      fireEvent.click(getByText('close'));
    });
    expect(container).toMatchSnapshot();
  });
});
