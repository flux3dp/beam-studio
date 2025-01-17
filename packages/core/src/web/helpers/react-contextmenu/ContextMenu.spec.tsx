import React from 'react';
import { act } from 'react-dom/test-utils';
import { fireEvent, render } from '@testing-library/react';

import ContextMenu from './ContextMenu';
import { showMenu, hideMenu } from './actions';

const setState = jest.spyOn(ContextMenu.prototype, 'setState');

describe('ContextMenu tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows when event with correct "id" is triggered', () => {
    const ID = 'CORRECT_ID';
    const x = 50;
    const y = 50;
    const { container } = render(<ContextMenu id={ID} />);

    expect(container).toMatchSnapshot();
    act(() => showMenu({ position: { x, y }, id: ID }));
    expect(setState).toHaveBeenCalledTimes(1);
    expect(setState).toHaveBeenNthCalledWith(1, {
      isVisible: true,
      x,
      y,
    });
    expect(container.querySelectorAll('.react-contextmenu--visible').length).toBe(1);
    expect(container).toMatchSnapshot();
  });

  test('does not shows when event with incorrect "id" is triggered', () => {
    const ID = 'CORRECT_ID';
    const x = 50;
    const y = 50;
    const { container } = render(<ContextMenu id={ID} />);

    expect(container).toMatchSnapshot();
    act(() => showMenu({ position: { x, y }, id: 'ID' }));
    expect(setState).not.toBeCalled();
    expect(container.querySelectorAll('.react-contextmenu--visible').length).toBe(0);
    expect(container).toMatchSnapshot();
  });

  test('onShow and onHide are triggered correctly', () => {
    const data = { position: { x: 50, y: 50 }, id: 'CORRECT_ID' };
    const onShow = jest.fn();
    const onHide = jest.fn();
    render(<ContextMenu id={data.id} onShow={onShow} onHide={onHide} />);

    act(() => {
      hideMenu();
      showMenu(data);
    });
    expect(setState).toHaveBeenCalledTimes(1);
    expect(setState).toHaveBeenNthCalledWith(1, {
      isVisible: true,
      ...data.position,
    });
    expect(onShow).toHaveBeenCalled();
    act(() => showMenu(data));
    expect(onShow).toHaveBeenCalledTimes(1);
    expect(onHide).not.toHaveBeenCalled();
    act(() => hideMenu());
    expect(setState).toHaveBeenCalledTimes(2);
    expect(setState).toHaveBeenNthCalledWith(2, {
      isVisible: false,
      forceSubMenuOpen: false,
      selectedItem: null,
    });
    expect(onShow).toHaveBeenCalledTimes(1);
    expect(onHide).toHaveBeenCalledTimes(1);
  });

  test('menu should close on "Escape"', () => {
    const data = { position: { x: 50, y: 50 }, id: 'CORRECT_ID' };
    const onHide = jest.fn();
    render(<ContextMenu id={data.id} onHide={onHide} />);
    const escape = new window.KeyboardEvent('keydown', { keyCode: 27 });

    act(() => showMenu(data));
    expect(setState).toHaveBeenCalledTimes(1);
    expect(setState).toHaveBeenNthCalledWith(1, {
      isVisible: true,
      ...data.position,
    });
    document.dispatchEvent(escape);
    expect(setState).toHaveBeenCalledTimes(2);
    expect(setState).toHaveBeenNthCalledWith(2, {
      isVisible: false,
      forceSubMenuOpen: false,
      selectedItem: null,
    });
    expect(onHide).toHaveBeenCalled();
  });

  test('menu should close on "Enter" when selectedItem is null', () => {
    const data = { position: { x: 50, y: 50 }, id: 'CORRECT_ID' };
    const onHide = jest.fn();
    render(<ContextMenu id={data.id} onHide={onHide} />);
    const enter = new window.KeyboardEvent('keydown', { keyCode: 13 });

    act(() => showMenu(data));
    expect(setState).toHaveBeenCalledTimes(1);
    expect(setState).toHaveBeenNthCalledWith(1, {
      isVisible: true,
      ...data.position,
    });
    document.dispatchEvent(enter);
    expect(setState).toHaveBeenCalledTimes(2);
    expect(setState).toHaveBeenNthCalledWith(2, {
      isVisible: false,
      forceSubMenuOpen: false,
      selectedItem: null,
    });
    expect(onHide).toHaveBeenCalled();
  });

  test('menu should close on "outside" click', () => {
    const data = { position: { x: 50, y: 50 }, id: 'CORRECT_ID' };
    const onHide = jest.fn();
    const { container } = render(<ContextMenu id={data.id} onHide={onHide} />);
    const outsideClick = new window.MouseEvent('mousedown');

    act(() => showMenu(data));
    expect(setState).toHaveBeenCalledTimes(1);
    expect(setState).toHaveBeenNthCalledWith(1, {
      isVisible: true,
      ...data.position,
    });
    fireEvent.mouseDown(container.querySelector('nav'));
    expect(setState).toHaveBeenCalledTimes(1);
    document.dispatchEvent(outsideClick);
    expect(setState).toHaveBeenCalledTimes(2);
    expect(setState).toHaveBeenNthCalledWith(2, {
      isVisible: false,
      forceSubMenuOpen: false,
      selectedItem: null,
    });
    expect(onHide).toHaveBeenCalled();
  });

  test('hideOnLeave and onMouseLeave options', () => {
    const data = { position: { x: 50, y: 50 }, id: 'CORRECT_ID' };
    const onMouseLeave = jest.fn();
    const { container } = render(
      <ContextMenu id={data.id} hideOnLeave onMouseLeave={onMouseLeave} />
    );

    act(() => showMenu(data));
    expect(setState).toHaveBeenCalledTimes(1);
    expect(setState).toHaveBeenNthCalledWith(1, {
      isVisible: true,
      ...data.position,
    });
    fireEvent.mouseLeave(container.querySelector('nav'));
    expect(setState).toHaveBeenCalledTimes(2);
    expect(setState).toHaveBeenNthCalledWith(2, {
      isVisible: false,
      forceSubMenuOpen: false,
      selectedItem: null,
    });
    expect(onMouseLeave).toHaveBeenCalled();
  });
});
