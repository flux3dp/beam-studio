import React from 'react';

import { fireEvent, render } from '@testing-library/react';

const mockUseInnerEngravingActive = jest.fn();
const mockPhotoPlaneEmit = jest.fn();
const mockBeginUndoableChange = jest.fn();
const mockAddCommandToHistory = jest.fn();
const mockBatchAddSubCommand = jest.fn();
const mockFinishUndoableChange = jest.fn(() => ({ isEmpty: () => false }));

jest.mock('@core/helpers/hooks/useWorkarea', () => () => 'fpm1');
jest.mock('@core/helpers/innerEngraving', () => ({
  useInnerEngravingActive: () => mockUseInnerEngravingActive(),
}));
jest.mock('@core/app/svgedit/history/history', () => ({
  BatchCommand: jest.fn(() => ({ addSubCommand: mockBatchAddSubCommand, isEmpty: () => false })),
}));
jest.mock('@core/app/svgedit/history/undoManager', () => ({
  addCommandToHistory: mockAddCommandToHistory,
  beginUndoableChange: mockBeginUndoableChange,
  finishUndoableChange: mockFinishUndoableChange,
}));
jest.mock('@core/app/svgedit/stl/photoPlane', () => ({
  photoPlaneEvents: { emit: (...args: unknown[]) => mockPhotoPlaneEmit(...args) },
}));
jest.mock('./DepthBlock', () => () => <div data-testid="depth-block" />);
jest.mock('./GradientBlock', () => ({ changeAttribute }: any) => (
  <button
    data-testid="gradient-block"
    onClick={() =>
      changeAttribute({
        'data-shading': true,
        'data-threshold': 254,
        'xlink:href': 'data:image/png;base64,GRADIENT==',
      })
    }
    type="button"
  />
));
jest.mock('./PwmBlock', () => () => <div data-testid="pwm-block" />);
jest.mock('./ThresholdBlock', () => () => <div data-testid="threshold-block" />);

import ImageOptions from '.';

describe('ImageOptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseInnerEngravingActive.mockReturnValue(false);
  });

  test('hides Promark depth engraving in 3D mode', () => {
    mockUseInnerEngravingActive.mockReturnValue(true);
    document.body.innerHTML = '<image id="photo" data-shading="true" />';

    const elem = document.getElementById('photo')!;
    const { getByTestId, queryByTestId } = render(<ImageOptions elem={elem} />);

    expect(getByTestId('gradient-block')).toBeInTheDocument();
    expect(queryByTestId('depth-block')).not.toBeInTheDocument();
  });

  test('keeps depth engraving for a regular Promark bitmap', () => {
    document.body.innerHTML = '<image id="photo" data-shading="true" />';

    const elem = document.getElementById('photo')!;
    const { getByTestId } = render(<ImageOptions elem={elem} />);

    expect(getByTestId('depth-block')).toBeInTheDocument();
  });

  test('actively synchronizes a processed photo texture with the 3D canvas', () => {
    mockUseInnerEngravingActive.mockReturnValue(true);
    document.body.innerHTML = '<image id="photo" data-stl-photo="1" />';

    const elem = document.getElementById('photo')!;
    const { getByTestId } = render(<ImageOptions elem={elem} />);

    fireEvent.click(getByTestId('gradient-block'));

    expect(elem.getAttribute('xlink:href')).toBe('data:image/png;base64,GRADIENT==');
    expect(mockPhotoPlaneEmit).toHaveBeenCalledWith('texture-changed', 'photo', 'data:image/png;base64,GRADIENT==');
  });
});
