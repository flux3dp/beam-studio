import * as React from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react';

import { setStorage } from '@mocks/@core/app/stores/storageStore';

const onCancel = jest.fn();
const onOk = jest.fn();

import ArrayModal from './ArrayModal';

// Improved drag function with delays to simulate realistic user interaction
const drag = async (element: Element, moveClientX: number) => {
  fireEvent.mouseDown(element, { buttons: 1 });
  await new Promise((resolve) => setTimeout(resolve, 100)); // Add a small delay
  fireEvent.mouseMove(element, { buttons: 1, clientX: moveClientX });
  await new Promise((resolve) => setTimeout(resolve, 100)); // Add a small delay
  fireEvent.mouseUp(element);
};

describe('ArrayModal', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Reset all mocks before each test
  });

  test('default unit is mm', async () => {
    jest.setTimeout(10000); // Increase timeout for this test

    const { baseElement, getAllByRole, getByText } = render(<ArrayModal onCancel={onCancel} onOk={onOk} />);

    expect(baseElement).toMatchSnapshot();

    const colSlider = getAllByRole('slider')[0];
    const colInput = getAllByRole('spinbutton')[0];

    expect(colSlider.getAttribute('aria-valuenow')).toBe('3');
    expect(colInput.getAttribute('aria-valuenow')).toBe('3');

    await drag(colSlider, 1);
    await waitFor(() => expect(colSlider.getAttribute('aria-valuenow')).toBe('10'), { timeout: 10000 });
    expect(colInput.getAttribute('aria-valuenow')).toBe('10');

    const dySlider = getAllByRole('slider')[3];
    const dyInput = getAllByRole('spinbutton')[3];

    expect(dySlider.getAttribute('aria-valuenow')).toBe('20');
    expect(dyInput.getAttribute('aria-valuenow')).toBe('20');

    fireEvent.change(dyInput, { target: { value: 60 } });
    await waitFor(() => expect(dySlider.getAttribute('aria-valuenow')).toBe('50'), { timeout: 10000 });
    expect(dyInput.getAttribute('aria-valuenow')).toBe('60');

    fireEvent.click(getByText('Confirm'));
    expect(onOk).toBeCalledTimes(1);
    expect(onOk).toBeCalledWith({ column: 10, dx: 20, dy: 60, row: 3 });
  }, 30000);

  test('default unit is inches', async () => {
    jest.setTimeout(10000); // Increase timeout for this test
    setStorage('default-units', 'inches');

    const { baseElement, getAllByRole, getByText } = render(<ArrayModal onCancel={onCancel} onOk={onOk} />);

    expect(baseElement).toMatchSnapshot();

    const dxSlider = getAllByRole('slider')[2];
    const dxInput = getAllByRole('spinbutton')[2];

    expect(dxSlider.getAttribute('aria-valuenow')).toBe('1');
    expect(dxInput.getAttribute('aria-valuenow')).toBe('1');

    fireEvent.change(dxInput, { target: { value: 3 } });
    await waitFor(() => expect(dxSlider.getAttribute('aria-valuenow')).toBe('2'), { timeout: 10000 });
    expect(dxInput.getAttribute('aria-valuenow')).toBe('3');

    fireEvent.click(getByText('Confirm'));
    expect(onOk).toBeCalledTimes(1);
    expect(onOk).toBeCalledWith({ column: 3, dx: 76.2, dy: 25.4, row: 3 });
  }, 10000);
});
