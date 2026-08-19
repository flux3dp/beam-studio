import React from 'react';

import { render, screen } from '@testing-library/react';

const mockDraggable = jest.fn();
const mockUseIsMobile = jest.fn();

jest.mock('antd', () => ({
  Modal: ({ children, modalRender, title }: any) =>
    modalRender(
      <div>
        <div>{title}</div>
        {children}
      </div>,
    ),
}));

jest.mock('react-draggable', () => (props: any) => {
  mockDraggable(props);

  return props.children;
});

jest.mock('@core/app/stores/screenStore', () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

import DraggableModal from './DraggableModal';

describe('DraggableModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsMobile.mockReturnValue(false);
  });

  test('only uses the title as the drag handle', () => {
    render(
      <DraggableModal open title="Modal title">
        <button type="button">Action</button>
      </DraggableModal>,
    );

    expect(mockDraggable).toHaveBeenCalledWith(
      expect.objectContaining({
        disabled: false,
        handle: '[data-draggable-modal-handle]',
      }),
    );
    expect(screen.getByText('Modal title').closest('[data-draggable-modal-handle]')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Action' }).closest('[data-draggable-modal-handle]')).toBeNull();
  });

  test('disables dragging on mobile when requested', () => {
    mockUseIsMobile.mockReturnValue(true);

    render(
      <DraggableModal disableMobileDrag open title="Modal title">
        Content
      </DraggableModal>,
    );

    expect(mockDraggable).toHaveBeenCalledWith(expect.objectContaining({ disabled: true }));
  });
});
