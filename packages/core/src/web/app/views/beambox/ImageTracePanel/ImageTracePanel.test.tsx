import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';

import ImageTracePanel from './ImageTracePanel';

const mockOnCropperShown = jest.fn();
const mockRemoveCropperShownListener = jest.fn();
jest.mock('app/stores/beambox-store', () => ({
  onCropperShown: (...args) => mockOnCropperShown(...args),
  removeCropperShownListener: (...args) => mockRemoveCropperShownListener(...args),
}));

jest.mock('app/views/beambox/ImageTracePanel/StepCrop', () => ({ onCropFinish, onCancel }: any) => (
  <div>
    Dummy StepCrop
    <button type="button" onClick={() => onCropFinish('mock-crop-data', 'mock-url')}>finish</button>
    <button type="button" onClick={onCancel}>cancel</button>
  </div>
));

jest.mock('app/views/beambox/ImageTracePanel/StepTune', () => ({ cropData, imageUrl, onGoBack, onClose }: any) => (
  <div>
    Dummy StepTune
    <p>cropData: {cropData}</p>
    <p>imageUrl: {imageUrl}</p>
    <button type="button" onClick={onGoBack}>back</button>
    <button type="button" onClick={onClose}>close</button>
  </div>
));

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
