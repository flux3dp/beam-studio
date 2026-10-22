import React from 'react';

import { fireEvent, render } from '@testing-library/react';
import { Box3, Quaternion, Vector3 } from 'three';

import type { StlObject } from '@core/app/stores/stlStore';
import { useStlStore } from '@core/app/stores/stlStore';

const mockApplyGroupTransform = jest.fn();

jest.mock('@core/app/stores/storageStore');
jest.mock('@core/app/widgets/UnitInput');
jest.mock('@core/helpers/i18n');
jest.mock('@core/app/components/beambox/InnerEngraving/utils/groupTransform', () => ({
  applyGroupTransform: (...args: unknown[]) => mockApplyGroupTransform(...args),
  // the union box: centre (100, 200, 50), size 40 × 20 × 0 in scene units (0.1mm)
  getGroupBox: () => new Box3(new Vector3(80, 190, 50), new Vector3(120, 210, 50)),
}));
jest.mock(
  './StlAdjustInput',
  () =>
    ({ disabled, id, onCommit }: { disabled?: boolean; id: string; onCommit: (value: number) => void }) => (
      <input aria-label={id} disabled={disabled} onChange={(e) => onCommit(Number(e.target.value))} />
    ),
);

import DimensionPanelStlMulti from './DimensionPanelStlMulti';

const objects = {
  a: { id: 'a' } as StlObject,
  b: { id: 'b' } as StlObject,
};
const center = new Vector3(100, 200, 50);

describe('DimensionPanelStlMulti', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useStlStore.setState({ objects });
  });

  test('shows the union box and no reset or ratio lock', () => {
    const { container } = render(<DimensionPanelStlMulti ids={['a', 'b']} />);

    expect(container.querySelector<HTMLInputElement>('#stl-position-x')!.value).toBe('10');
    expect(container.querySelector<HTMLInputElement>('#stl-position-y')!.value).toBe('20');
    expect(container.querySelector<HTMLInputElement>('#stl-size-x')!.value).toBe('4');
    // rotation has no common value
    expect(container.querySelector<HTMLInputElement>('#stl-rotation-x')).toBeDisabled();
    expect(container.querySelector<HTMLInputElement>('#stl-rotation-x')!.value).toBe('');
    expect(container.querySelector('#stl-position-reset')).toBeNull();
    expect(container.querySelector('#stl-ratio-lock')).toBeNull();
  });

  test('position moves the whole selection', () => {
    const { container, getByLabelText } = render(<DimensionPanelStlMulti ids={['a', 'b']} />);

    fireEvent.change(container.querySelector('#stl-position-x')!, { target: { value: '15' } });
    expect(mockApplyGroupTransform).toHaveBeenLastCalledWith(
      [objects.a, objects.b],
      { translation: new Vector3(50, 0, 0) },
      center,
    );

    fireEvent.change(getByLabelText('stl-position-z-adjust'), { target: { value: '-2' } });
    expect(mockApplyGroupTransform).toHaveBeenLastCalledWith(
      [objects.a, objects.b],
      { translation: new Vector3(0, 0, -20) },
      center,
    );
  });

  test('size scales proportionally, and a flat axis cannot be sized', () => {
    const { container, getByLabelText } = render(<DimensionPanelStlMulti ids={['a', 'b']} />);

    fireEvent.change(container.querySelector('#stl-size-y')!, { target: { value: '4' } });
    expect(mockApplyGroupTransform).toHaveBeenLastCalledWith([objects.a, objects.b], { scale: 2 }, center);

    fireEvent.change(getByLabelText('stl-size-x-adjust'), { target: { value: '50' } });
    expect(mockApplyGroupTransform).toHaveBeenLastCalledWith([objects.a, objects.b], { scale: 0.5 }, center);

    expect(container.querySelector('#stl-size-z')).toBeDisabled();
    expect(getByLabelText('stl-size-z-adjust')).toBeDisabled();
  });

  test('rotation turns the selection about a world axis through its centre', () => {
    const { getByLabelText } = render(<DimensionPanelStlMulti ids={['a', 'b']} />);

    fireEvent.change(getByLabelText('stl-rotation-z-adjust'), { target: { value: '90' } });

    const [, delta, pivot] = mockApplyGroupTransform.mock.lastCall;
    const expected = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), Math.PI / 2);

    expect(pivot).toEqual(center);
    expect(delta.rotation.angleTo(expected)).toBeCloseTo(0);
  });

  test('flip mirrors the selection across its centre', () => {
    const { container } = render(<DimensionPanelStlMulti ids={['a', 'b']} />);

    fireEvent.click(container.querySelector('#stl-flip-y')!);
    expect(mockApplyGroupTransform).toHaveBeenLastCalledWith([objects.a, objects.b], { mirrorAxis: 1 }, center);
  });
});
