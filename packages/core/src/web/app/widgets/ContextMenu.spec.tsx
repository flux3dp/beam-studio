import React from 'react';

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import * as systemHelper from '@core/helpers/system-helper';

import ContextMenu from './ContextMenu';

jest.mock('@core/helpers/system-helper', () => ({
  ...jest.requireActual('@core/helpers/system-helper'),
  isIOS: jest.fn(() => false),
}));

const mockIsIOS = systemHelper.isIOS as jest.Mock;
const mockOnClick = jest.fn();

describe('test ContextMenu', () => {
  beforeEach(() => {
    mockOnClick.mockClear();
    mockIsIOS.mockReturnValue(false);
  });

  it('should render children', () => {
    render(
      <ContextMenu items={[{ key: 'test', label: 'Test Item' }]}>
        <div data-testid="trigger">Trigger</div>
      </ContextMenu>,
    );

    expect(screen.getByTestId('trigger')).toBeInTheDocument();
  });

  it('should open menu on right-click and handle click', async () => {
    render(
      <ContextMenu items={[{ key: 'action', label: 'Action' }]} onClick={mockOnClick}>
        <div data-testid="trigger">Trigger</div>
      </ContextMenu>,
    );

    fireEvent.contextMenu(screen.getByTestId('trigger'));

    await waitFor(() => {
      expect(screen.getByText('Action')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Action'));

    expect(mockOnClick).toHaveBeenCalledWith(expect.objectContaining({ key: 'action' }));
  });

  it('should not open menu when disabled', async () => {
    render(
      <ContextMenu disabled items={[{ key: 'test', label: 'Test Item' }]}>
        <div data-testid="trigger">Trigger</div>
      </ContextMenu>,
    );

    fireEvent.contextMenu(screen.getByTestId('trigger'));

    await waitFor(() => {
      expect(screen.queryByText('Test Item')).not.toBeInTheDocument();
    });
  });

  describe('iOS long-press', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      mockIsIOS.mockReturnValue(true);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should dispatch contextmenu on touch target after 500ms', () => {
      render(
        <ContextMenu items={[{ key: 'test', label: 'Test Item' }]}>
          <div data-testid="trigger">Trigger</div>
        </ContextMenu>,
      );

      const trigger = screen.getByTestId('trigger');
      const spy = jest.fn();

      trigger.addEventListener('contextmenu', spy);

      act(() => {
        fireEvent.touchStart(trigger, { touches: [{ clientX: 200, clientY: 300 }] });
        jest.advanceTimersByTime(500);
      });

      expect(spy).toHaveBeenCalledTimes(1);
      expect((spy.mock.calls[0][0] as MouseEvent).clientX).toBe(200);
      expect((spy.mock.calls[0][0] as MouseEvent).clientY).toBe(300);

      trigger.removeEventListener('contextmenu', spy);
    });

    it('should not dispatch contextmenu on long-press when disabled', () => {
      render(
        <ContextMenu disabled items={[{ key: 'test', label: 'Test Item' }]}>
          <div data-testid="trigger">Trigger</div>
        </ContextMenu>,
      );

      const trigger = screen.getByTestId('trigger');
      const spy = jest.fn();

      trigger.addEventListener('contextmenu', spy);

      act(() => {
        fireEvent.touchStart(trigger, { touches: [{ clientX: 100, clientY: 100 }] });
        jest.advanceTimersByTime(500);
      });

      expect(spy).not.toHaveBeenCalled();
      trigger.removeEventListener('contextmenu', spy);
    });

    it('should cancel long-press on early touch end', () => {
      render(
        <ContextMenu items={[{ key: 'test', label: 'Test Item' }]}>
          <div data-testid="trigger">Trigger</div>
        </ContextMenu>,
      );

      const trigger = screen.getByTestId('trigger');
      const spy = jest.fn();

      trigger.addEventListener('contextmenu', spy);

      act(() => {
        fireEvent.touchStart(trigger, { touches: [{ clientX: 100, clientY: 100 }] });
        jest.advanceTimersByTime(300);
        fireEvent.touchEnd(trigger);
        jest.advanceTimersByTime(300);
      });

      expect(spy).not.toHaveBeenCalled();
      trigger.removeEventListener('contextmenu', spy);
    });

    it('should cancel long-press when touch moves beyond threshold', () => {
      render(
        <ContextMenu items={[{ key: 'test', label: 'Test Item' }]}>
          <div data-testid="trigger">Trigger</div>
        </ContextMenu>,
      );

      const trigger = screen.getByTestId('trigger');
      const spy = jest.fn();

      trigger.addEventListener('contextmenu', spy);

      act(() => {
        fireEvent.touchStart(trigger, { touches: [{ clientX: 100, clientY: 100 }] });
        jest.advanceTimersByTime(200);
        fireEvent.touchMove(trigger, { touches: [{ clientX: 120, clientY: 100 }] });
        jest.advanceTimersByTime(400);
      });

      expect(spy).not.toHaveBeenCalled();
      trigger.removeEventListener('contextmenu', spy);
    });

    it('should not cancel long-press when touch moves within threshold', () => {
      render(
        <ContextMenu items={[{ key: 'test', label: 'Test Item' }]}>
          <div data-testid="trigger">Trigger</div>
        </ContextMenu>,
      );

      const trigger = screen.getByTestId('trigger');
      const spy = jest.fn();

      trigger.addEventListener('contextmenu', spy);

      act(() => {
        fireEvent.touchStart(trigger, { touches: [{ clientX: 100, clientY: 100 }] });
        jest.advanceTimersByTime(200);
        // Move exactly 10px (at threshold) — should NOT cancel
        fireEvent.touchMove(trigger, { touches: [{ clientX: 110, clientY: 100 }] });
        jest.advanceTimersByTime(400);
      });

      expect(spy).toHaveBeenCalledTimes(1);
      trigger.removeEventListener('contextmenu', spy);
    });
  });

  describe('touch device close behavior', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'ontouchstart', { configurable: true, value: null });
    });

    afterEach(() => {
      delete (window as any).ontouchstart;
    });

    it('should synthesize mousedown/click on outside touch to close dropdown', async () => {
      render(
        <ContextMenu items={[{ key: 'test', label: 'Test Item' }]}>
          <div data-testid="trigger">Trigger</div>
        </ContextMenu>,
      );

      fireEvent.contextMenu(screen.getByTestId('trigger'));

      await waitFor(() => {
        expect(screen.getByText('Test Item')).toBeInTheDocument();
      });

      const spy = jest.fn();

      document.body.addEventListener('mousedown', spy);
      fireEvent.touchStart(document.body);

      expect(spy).toHaveBeenCalled();
      document.body.removeEventListener('mousedown', spy);
    });

    it('should not synthesize mousedown when touching inside the popup', async () => {
      render(
        <ContextMenu items={[{ key: 'test', label: 'Test Item' }]}>
          <div data-testid="trigger">Trigger</div>
        </ContextMenu>,
      );

      fireEvent.contextMenu(screen.getByTestId('trigger'));

      await waitFor(() => {
        expect(screen.getByText('Test Item')).toBeInTheDocument();
      });

      const spy = jest.fn();

      document.body.addEventListener('mousedown', spy);

      const menuItem = screen.getByText('Test Item');

      fireEvent.touchStart(menuItem);

      expect(spy).not.toHaveBeenCalled();
      document.body.removeEventListener('mousedown', spy);
    });
  });
});
