import React from 'react';

import { act, fireEvent, render } from '@testing-library/react';

const mockUpdatePhotoTo3d = jest.fn();
const mockAlertPhotoTo3dError = jest.fn();

jest.mock('@core/app/svgedit/stl/photoTo3d', () => {
  const { create } = jest.requireActual('zustand');

  return {
    alertPhotoTo3dError: (...args: unknown[]) => mockAlertPhotoTo3dError(...args),
    EDGE_ROUND_LIMIT: { max: 10, min: 0 },
    getPhotoTo3dSettings: (elem: Element) => ({
      edgeRoundMm: Number(elem.getAttribute('data-stl-depth-round')),
      sharpenAmount: Number(elem.getAttribute('data-stl-depth-sharpen')),
      sharpenRadius: Number(elem.getAttribute('data-stl-depth-radius')),
    }),
    SHARPEN_AMOUNT_LIMIT: { max: 5, min: 0 },
    SHARPEN_RADIUS_LIMIT: { max: 20, min: 0.5 },
    updatePhotoTo3d: (...args: unknown[]) => mockUpdatePhotoTo3d(...args),
    usePhotoTo3dBusy: create(() => ({ ids: [] as string[] })),
  };
});
jest.mock('@core/app/svgedit/stl/photoTo3d/runPhotoTo3d', () => ({ PhotoTo3dCancelledError: class extends Error {} }));

import { usePhotoTo3dBusy } from '@core/app/svgedit/stl/photoTo3d';

import PhotoTo3dOptions from './PhotoTo3dOptions';

const makeElem = () => {
  const elem = document.createElementNS('http://www.w3.org/2000/svg', 'image') as SVGImageElement;

  elem.id = 'photo';
  elem.setAttribute('data-stl-depth-sharpen', '1');
  elem.setAttribute('data-stl-depth-radius', '4');
  elem.setAttribute('data-stl-depth-round', '2');

  return elem;
};

describe('PhotoTo3dOptions', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockUpdatePhotoTo3d.mockResolvedValue(true);
  });

  afterEach(() => jest.useRealTimers());

  test('shows the saved sharpening and roll-off', () => {
    const { container } = render(<PhotoTo3dOptions elem={makeElem()} />);

    expect(container.querySelector<HTMLInputElement>('#photo-to-3d-sharpenAmount')!.value).toBe('1.0');
    expect(container.querySelector<HTMLInputElement>('#photo-to-3d-sharpenRadius')!.value).toBe('4.0');
    expect(container.querySelector<HTMLInputElement>('#photo-to-3d-edgeRoundMm')!.value).toBe('2.0');
  });

  test('a finished edit recomputes the point cloud as its own undo step', () => {
    const elem = makeElem();
    const { container } = render(<PhotoTo3dOptions elem={elem} />);
    const input = container.querySelector<HTMLInputElement>('#photo-to-3d-sharpenAmount')!;

    fireEvent.change(input, { target: { value: '2.5' } });
    expect(mockUpdatePhotoTo3d).not.toHaveBeenCalled();
    fireEvent.blur(input);
    expect(mockUpdatePhotoTo3d).toHaveBeenCalledWith(elem, { sharpenAmount: 2.5 }, 'new');
  });

  test('a typed value stays while the cloud is computed, and is read back from the element after', () => {
    const elem = makeElem();
    const { container } = render(<PhotoTo3dOptions elem={elem} />);
    const query = () => container.querySelector<HTMLInputElement>('#photo-to-3d-sharpenAmount')!;

    fireEvent.change(query(), { target: { value: '2.5' } });
    fireEvent.blur(query());
    act(() => usePhotoTo3dBusy.setState({ ids: ['photo'] }));
    expect(query().value).toBe('2.5');

    elem.setAttribute('data-stl-depth-sharpen', '2.5');
    act(() => usePhotoTo3dBusy.setState({ ids: [] }));
    expect(query().value).toBe('2.5');

    // a computation that failed leaves the element as it was, and the field follows it
    fireEvent.change(query(), { target: { value: '3' } });
    fireEvent.blur(query());
    act(() => usePhotoTo3dBusy.setState({ ids: ['photo'] }));
    act(() => usePhotoTo3dBusy.setState({ ids: [] }));
    expect(query().value).toBe('2.5');
  });

  test('shows updating only for a computation that takes a while', () => {
    const { container } = render(<PhotoTo3dOptions elem={makeElem()} />);

    act(() => usePhotoTo3dBusy.setState({ ids: ['photo'] }));
    expect(container.querySelector('#photo-to-3d-updating')).toBeNull();
    act(() => jest.advanceTimersByTime(300));
    expect(container.querySelector('#photo-to-3d-updating')).not.toBeNull();
    act(() => usePhotoTo3dBusy.setState({ ids: [] }));
    expect(container.querySelector('#photo-to-3d-updating')).toBeNull();
  });
});
