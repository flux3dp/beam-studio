/* eslint-disable import/first */
import * as React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';

const onCancel = jest.fn();
const onOk = jest.fn();

const get = jest.fn();
jest.mock('implementations/storage', () => ({
  get,
}));

import ArrayModal from './ArrayModal';

const drag = (element: Element, moveClientX: number) => {
  fireEvent.mouseDown(element, { buttons: 1 });
  fireEvent.mouseMove(element, { buttons: 1, clientX: moveClientX });
  fireEvent.mouseUp(element);
};

describe('should render correctly', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('default unit is mm', async () => {
    get.mockReturnValue(undefined);
    const { baseElement, getAllByRole, getByText } = render(
      <ArrayModal onCancel={onCancel} onOk={onOk} />
    );
    expect(get).toBeCalledTimes(1);
    expect(baseElement).toMatchSnapshot();
    const colSlider = getAllByRole('slider')[0];
    const colInput = getAllByRole('spinbutton')[0];
    expect(colSlider.getAttribute('aria-valuenow')).toBe('3');
    expect(colInput.getAttribute('aria-valuenow')).toBe('3');
    drag(colSlider, 1);
    await waitFor(() => expect(colSlider.getAttribute('aria-valuenow')).toBe('10'));
    expect(colInput.getAttribute('aria-valuenow')).toBe('10');
    const dySlider = getAllByRole('slider')[3];
    const dyInput = getAllByRole('spinbutton')[3];
    expect(dySlider.getAttribute('aria-valuenow')).toBe('20');
    expect(dyInput.getAttribute('aria-valuenow')).toBe('20');
    fireEvent.change(dyInput, { target: { value: 60 } });
    await waitFor(() => expect(dySlider.getAttribute('aria-valuenow')).toBe('50'));
    expect(dyInput.getAttribute('aria-valuenow')).toBe('60');
    fireEvent.click(getByText('Confirm'));
    expect(onOk).toBeCalledTimes(1);
    expect(onOk).toBeCalledWith({ column: 10, row: 3, dx: 20, dy: 60 });
  });

  test('default unit is inches', async () => {
    get.mockReturnValue('inches');
    const { baseElement, getAllByRole, getByText } = render(
      <ArrayModal onCancel={onCancel} onOk={onOk} />
    );
    expect(get).toBeCalledTimes(1);
    expect(baseElement).toMatchSnapshot();
    const dxSlider = getAllByRole('slider')[2];
    const dxInput = getAllByRole('spinbutton')[2];
    expect(dxSlider.getAttribute('aria-valuenow')).toBe('1');
    expect(dxInput.getAttribute('aria-valuenow')).toBe('1');
    fireEvent.change(dxInput, { target: { value: 3 } });
    await waitFor(() => expect(dxSlider.getAttribute('aria-valuenow')).toBe('2'));
    expect(dxInput.getAttribute('aria-valuenow')).toBe('3');
    fireEvent.click(getByText('Confirm'));
    expect(onOk).toBeCalledTimes(1);
    expect(onOk).toBeCalledWith({ column: 3, row: 3, dx: 76.2, dy: 25.4 });
  });
});
