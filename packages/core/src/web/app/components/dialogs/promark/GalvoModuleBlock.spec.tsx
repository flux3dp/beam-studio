import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import GalvoModuleBlock from './GalvoModuleBlock';

const mockFocusHeightChange = jest.fn();
const mockOffsetsChange = jest.fn();
const mockOffsets = { x: 1.5, y: -2 };

const renderBlock = () =>
  render(
    <GalvoModuleBlock
      focusHeight={8}
      isInch={false}
      offsets={mockOffsets}
      onFocusHeightChange={mockFocusHeightChange}
      onOffsetsChange={mockOffsetsChange}
    />,
  );

describe('test GalvoModuleBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { container } = renderBlock();

    expect(container).toMatchSnapshot();
  });

  it('should report a focus height change', () => {
    const { getByTestId } = renderBlock();

    fireEvent.change(getByTestId('focus-height'), { target: { value: '12.5' } });
    expect(mockFocusHeightChange).toHaveBeenLastCalledWith(12.5);
  });

  // the module offset is the head's position relative to the nozzle, kept apart from the field's
  // own offset, so each axis reports the whole pair back unchanged except for the one edited
  it.each([
    ['module-offset-x', 'x', { x: 10, y: -2 }],
    ['module-offset-y', 'y', { x: 1.5, y: 4 }],
  ] as const)('should report an offset change on %s', (testId, _axis, expected) => {
    const { getByTestId } = renderBlock();

    fireEvent.change(getByTestId(testId), { target: { value: testId.endsWith('x') ? '10' : '4' } });
    expect(mockOffsetsChange).toHaveBeenLastCalledWith(expected);
  });
});
