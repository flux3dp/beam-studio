import * as React from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react';

const onCancel = jest.fn();
const onOk = jest.fn();

const get = jest.fn();

jest.mock('@core/implementations/storage', () => ({
  get,
}));

import OffsetModal from './OffsetModal';

const drag = (element: Element, moveClientX: number) => {
  fireEvent.mouseDown(element, { buttons: 1 });
  fireEvent.mouseMove(element, { buttons: 1, clientX: moveClientX });
  fireEvent.mouseUp(element);
};

describe('should render correctly', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('default unit is mm', async () => {
    get.mockReturnValue(undefined);

    const { baseElement, getByRole, getByText } = render(<OffsetModal onCancel={onCancel} onOk={onOk} />);

    expect(get).toHaveBeenCalledTimes(1);
    expect(baseElement).toMatchSnapshot();

    const directionSelect = baseElement.querySelectorAll('.ant-select-selector')[0];

    expect(directionSelect).toHaveTextContent('Outward');
    fireEvent.mouseDown(directionSelect);
    fireEvent.click(getByText('Inward'));
    expect(directionSelect).toHaveTextContent('Inward');

    const cornerTypeSelect = baseElement.querySelectorAll('.ant-select-selector')[1];

    expect(cornerTypeSelect).toHaveTextContent('Sharp');
    fireEvent.mouseDown(cornerTypeSelect);
    fireEvent.click(getByText('Round'));
    expect(cornerTypeSelect).toHaveTextContent('Round');

    const offsetSlider = getByRole('slider');
    const offsetInput = getByRole('spinbutton');

    expect(offsetSlider.getAttribute('aria-valuenow')).toBe('5');
    expect(offsetInput.getAttribute('aria-valuenow')).toBe('5');
    drag(offsetSlider, 1);
    await waitFor(() => expect(offsetSlider.getAttribute('aria-valuenow')).toBe('20'));
    expect(offsetInput.getAttribute('aria-valuenow')).toBe('20');
    fireEvent.change(offsetInput, { target: { value: 10 } });
    await waitFor(() => expect(offsetSlider.getAttribute('aria-valuenow')).toBe('10'));
    expect(offsetInput.getAttribute('aria-valuenow')).toBe('10');
    fireEvent.click(getByText('Confirm'));
    expect(onOk).toHaveBeenCalledTimes(1);
    expect(onOk).toHaveBeenCalledWith({ cornerType: 'round', distance: 10, mode: 'inward' });
  }, 30000);

  test('default unit is inches', async () => {
    get.mockReturnValue('inches');

    const { baseElement, getByRole, getByText } = render(<OffsetModal onCancel={onCancel} onOk={onOk} />);

    expect(get).toHaveBeenCalledTimes(1);
    expect(baseElement).toMatchSnapshot();

    const offsetSlider = getByRole('slider');
    const offsetInput = getByRole('spinbutton');

    fireEvent.change(offsetInput, { target: { value: 1.5 } });
    await waitFor(() => expect(offsetSlider.getAttribute('aria-valuenow')).toBe('1'));
    expect(offsetInput.getAttribute('aria-valuenow')).toBe('1.5');
    fireEvent.click(getByText('Confirm'));
    expect(onOk).toHaveBeenCalledTimes(1);
    expect(onOk).toHaveBeenCalledWith({ cornerType: 'sharp', distance: 38.1, mode: 'outward' });
  });
});
