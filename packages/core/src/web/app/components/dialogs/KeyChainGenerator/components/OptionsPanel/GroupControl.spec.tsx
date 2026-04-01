import React from 'react';
import { fireEvent, render } from '@testing-library/react';

jest.mock('antd', () => ({
  Collapse: ({ activeKey, collapsible, items, onChange }: any) => (
    <div data-testid="collapse">
      {items.map((item: any) => (
        <div key={item.key}>
          <div
            data-testid="collapse-header"
            onClick={() =>
              collapsible !== 'disabled' && onChange?.((activeKey || []).includes(item.key) ? [] : [item.key])
            }
          >
            {item.label}
          </div>
          {(activeKey || []).includes(item.key) && <div data-testid="collapse-content">{item.children}</div>}
        </div>
      ))}
      <span data-testid="collapsible">{collapsible ?? 'default'}</span>
    </div>
  ),
  Switch: ({ checked, onChange, onClick }: any) => (
    <button
      data-testid="switch"
      onClick={(e) => {
        onClick?.(checked, e);
        onChange?.(!checked);
      }}
    >
      {String(checked)}
    </button>
  ),
}));

import GroupControl from './GroupControl';

describe('GroupControl', () => {
  const defaultProps = {
    enabled: true,
    id: 'test-group',
    onToggle: jest.fn(),
    title: 'Test Group',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render title', () => {
    const { getByText } = render(
      <GroupControl {...defaultProps}>
        <div>content</div>
      </GroupControl>,
    );

    expect(getByText('Test Group')).toBeInTheDocument();
  });

  it('should show children when enabled and expanded', () => {
    const { getByText } = render(
      <GroupControl {...defaultProps}>
        <div>child content</div>
      </GroupControl>,
    );

    expect(getByText('child content')).toBeInTheDocument();
  });

  it('should hide children when disabled', () => {
    const { queryByText } = render(
      <GroupControl {...defaultProps} enabled={false}>
        <div>child content</div>
      </GroupControl>,
    );

    expect(queryByText('child content')).not.toBeInTheDocument();
  });

  it('should call onToggle when switch is clicked', () => {
    const { getByTestId } = render(
      <GroupControl {...defaultProps}>
        <div>content</div>
      </GroupControl>,
    );

    fireEvent.click(getByTestId('switch'));
    expect(defaultProps.onToggle).toHaveBeenCalledWith(false);
  });

  it('should expand when toggled from disabled to enabled', () => {
    const { getByTestId, queryByText, rerender } = render(
      <GroupControl {...defaultProps} enabled={false}>
        <div>child content</div>
      </GroupControl>,
    );

    expect(queryByText('child content')).not.toBeInTheDocument();

    // Simulate toggle on
    fireEvent.click(getByTestId('switch'));

    rerender(
      <GroupControl {...defaultProps} enabled>
        <div>child content</div>
      </GroupControl>,
    );
    expect(queryByText('child content')).toBeInTheDocument();
  });

  it('should set collapsible to disabled when not enabled', () => {
    const { getByTestId } = render(
      <GroupControl {...defaultProps} enabled={false}>
        <div>content</div>
      </GroupControl>,
    );

    expect(getByTestId('collapsible').textContent).toBe('disabled');
  });

  it('should allow manual collapse/expand when enabled', () => {
    const { getByTestId, queryByText } = render(
      <GroupControl {...defaultProps}>
        <div>child content</div>
      </GroupControl>,
    );

    expect(queryByText('child content')).toBeInTheDocument();

    // Click header to collapse
    fireEvent.click(getByTestId('collapse-header'));
    expect(queryByText('child content')).not.toBeInTheDocument();

    // Click header to expand again
    fireEvent.click(getByTestId('collapse-header'));
    expect(queryByText('child content')).toBeInTheDocument();
  });
});
