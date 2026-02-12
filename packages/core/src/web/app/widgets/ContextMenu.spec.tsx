import React from 'react';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import ContextMenu from './ContextMenu';

const mockOnClick = jest.fn();

describe('test ContextMenu', () => {
  beforeEach(() => {
    mockOnClick.mockClear();
  });

  it('should render with single item', () => {
    const { container } = render(
      <ContextMenu items={[{ key: 'test', label: 'Test Item' }]}>
        <div data-testid="trigger">Trigger</div>
      </ContextMenu>,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render with multiple items and dividers', () => {
    const { container } = render(
      <ContextMenu
        items={[{ key: 'item1', label: 'Item 1' }, { type: 'divider' as const }, { key: 'item2', label: 'Item 2' }]}
      >
        <div data-testid="trigger">Trigger</div>
      </ContextMenu>,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render with nested items (submenu)', () => {
    const { container } = render(
      <ContextMenu
        items={[
          { key: 'item1', label: 'Item 1' },
          {
            children: [
              { key: 'sub1', label: 'Sub Item 1' },
              { key: 'sub2', label: 'Sub Item 2' },
            ],
            key: 'submenu',
            label: 'Submenu',
          },
        ]}
      >
        <div data-testid="trigger">Trigger</div>
      </ContextMenu>,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render disabled menu', () => {
    const { container } = render(
      <ContextMenu disabled items={[{ key: 'test', label: 'Test Item' }]}>
        <div data-testid="trigger">Trigger</div>
      </ContextMenu>,
    );

    expect(container).toMatchSnapshot();
  });

  it('should open menu on right-click (default trigger) and handle click', async () => {
    render(
      <ContextMenu items={[{ key: 'action', label: 'Action' }]} onClick={mockOnClick}>
        <div data-testid="trigger">Trigger</div>
      </ContextMenu>,
    );

    // Open context menu with right-click
    fireEvent.contextMenu(screen.getByTestId('trigger'));

    // Wait for menu to appear
    await waitFor(() => {
      expect(screen.getByText('Action')).toBeInTheDocument();
    });

    // Click menu item
    fireEvent.click(screen.getByText('Action'));

    // Verify onClick was called with correct key
    expect(mockOnClick).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'action',
      }),
    );
  });

  it('should support custom click trigger', async () => {
    render(
      <ContextMenu items={[{ key: 'test', label: 'Test Item' }]} trigger={['click']}>
        <div data-testid="trigger">Trigger</div>
      </ContextMenu>,
    );

    // Should open on left-click when trigger is ['click']
    fireEvent.click(screen.getByTestId('trigger'));

    await waitFor(() => {
      expect(screen.getByText('Test Item')).toBeInTheDocument();
    });
  });

  it('should support dual trigger (click and contextMenu)', async () => {
    render(
      <ContextMenu items={[{ key: 'test', label: 'Test Item' }]} trigger={['click', 'contextMenu']}>
        <div data-testid="trigger">Trigger</div>
      </ContextMenu>,
    );

    // Should open on left-click
    fireEvent.click(screen.getByTestId('trigger'));
    await waitFor(() => {
      expect(screen.getByText('Test Item')).toBeInTheDocument();
    });

    // Close menu
    fireEvent.click(document.body);

    // Should also open on right-click
    fireEvent.contextMenu(screen.getByTestId('trigger'));
    await waitFor(() => {
      expect(screen.getByText('Test Item')).toBeInTheDocument();
    });
  });

  it('should not open menu when disabled', async () => {
    render(
      <ContextMenu disabled items={[{ key: 'test', label: 'Test Item' }]}>
        <div data-testid="trigger">Trigger</div>
      </ContextMenu>,
    );

    fireEvent.contextMenu(screen.getByTestId('trigger'));

    // Wait a bit and verify menu did not appear
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(screen.queryByText('Test Item')).not.toBeInTheDocument();
  });

  it('should handle empty items array', () => {
    const { container } = render(
      <ContextMenu items={[]}>
        <div data-testid="trigger">Trigger</div>
      </ContextMenu>,
    );

    expect(container).toMatchSnapshot();
  });

  it('should handle null/undefined items gracefully', () => {
    const { container } = render(
      <ContextMenu items={[{ key: 'item1', label: 'Item 1' }, null, { key: 'item2', label: 'Item 2' }]}>
        <div data-testid="trigger">Trigger</div>
      </ContextMenu>,
    );

    expect(container).toMatchSnapshot();
  });
});
