import React from 'react';

import { act, fireEvent, render, waitFor } from '@testing-library/react';

import type { StlObject } from '@core/app/stores/stlStore';
import { useStlStore } from '@core/app/stores/stlStore';
import { useViewStore } from '@core/app/components/beambox/InnerEngraving/viewStore';

const mockChangeSelectedAttribute = jest.fn();
const mockSetTransform = jest.fn();

jest.mock('@core/app/stores/storageStore');
jest.mock('@core/app/widgets/UnitInput');
jest.mock('@core/helpers/i18n');
jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync: (callback: (globalSVG: unknown) => void) =>
    callback({ Canvas: { changeSelectedAttribute: (...args: unknown[]) => mockChangeSelectedAttribute(...args) } }),
}));
jest.mock('@core/app/components/beambox/InnerEngraving/utils/transform', () => ({
  getBaseSize: () => ({ getComponent: (axis: number) => [10, 20, 30][axis] }),
  setTransform: (...args: unknown[]) => mockSetTransform(...args),
}));
jest.mock('./StlAdjustInput', () => ({ id }: { id: string }) => <input aria-label={id} />);

import DimensionPanelStl from './DimensionPanelStl';

const transform = {
  flip: [false, false, false],
  position: [10, 20, 30],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
} as StlObject['transform'];

const object = {
  geometry: {},
  id: 'stl',
  initialTransform: transform,
  transform,
} as StlObject;

describe('DimensionPanelStl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '<svg><rect data-ratiofixed="true" id="stl" /></svg>';
    useStlStore.setState({ objects: { stl: object }, selectedId: 'stl' });
    useViewStore.setState({ transformMode: 'translate' });
    mockChangeSelectedAttribute.mockImplementation((attr: string, value: string, elems: Element[]) => {
      elems.forEach((elem) => elem.setAttribute(attr, value));
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('stores ratio lock on the selected projection through the history-aware canvas API', async () => {
    const { container } = render(<DimensionPanelStl id="stl" />);
    const ratioButton = container.querySelector<HTMLButtonElement>('#stl-ratio-lock')!;
    const elem = document.getElementById('stl')!;

    await act(async () => fireEvent.click(ratioButton));

    expect(mockChangeSelectedAttribute).toHaveBeenLastCalledWith('data-ratiofixed', 'false', [elem]);

    // Simulate undo. The observer must refresh the panel so the next click inverts the restored value.
    await act(async () => elem.setAttribute('data-ratiofixed', 'true'));
    await act(async () => fireEvent.click(ratioButton));

    expect(mockChangeSelectedAttribute).toHaveBeenLastCalledWith('data-ratiofixed', 'false', [elem]);
  });

  test('uses the projection ratio setting when changing size', async () => {
    const { container } = render(<DimensionPanelStl id="stl" />);

    fireEvent.change(container.querySelector('#stl-size-x')!, { target: { value: '20' } });
    expect(mockSetTransform).toHaveBeenLastCalledWith(object, { ...transform, scale: [2, 2, 2] });

    await act(async () => document.getElementById('stl')!.setAttribute('data-ratiofixed', 'false'));
    fireEvent.change(container.querySelector('#stl-size-x')!, { target: { value: '20' } });

    expect(mockSetTransform).toHaveBeenLastCalledWith(object, { ...transform, scale: [2, 1, 1] });
  });

  test('renders each transform control after reset and highlights the active mode', async () => {
    const { container } = render(<DimensionPanelStl id="stl" />);
    const positionReset = container.querySelector<HTMLButtonElement>('#stl-position-reset')!;
    const translate = container.querySelector<HTMLButtonElement>('#stl-transform-translate')!;
    const sizeReset = container.querySelector<HTMLButtonElement>('#stl-size-reset')!;
    const scale = container.querySelector<HTMLButtonElement>('#stl-transform-scale')!;
    const rotationReset = container.querySelector<HTMLButtonElement>('#stl-rotation-reset')!;
    const rotate = container.querySelector<HTMLButtonElement>('#stl-transform-rotate')!;

    expect(positionReset.nextElementSibling).toBe(translate);
    expect(sizeReset.nextElementSibling).toBe(scale);
    expect(rotationReset.nextElementSibling).toBe(rotate);
    expect(translate).toHaveClass('ant-btn-color-blue', 'ant-btn-variant-text');
    expect(scale).toHaveClass('ant-btn-color-default', 'ant-btn-variant-text');
    expect(positionReset).toHaveClass('actionButton');
    expect(translate).toHaveClass('actionButton');

    fireEvent.click(scale);

    expect(useViewStore.getState().transformMode).toBe('scale');
    await waitFor(() => expect(scale).toHaveClass('ant-btn-color-blue'));
    expect(translate).toHaveClass('ant-btn-color-default');
  });
});
