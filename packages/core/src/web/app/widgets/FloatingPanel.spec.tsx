import React from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react';

import FloatingPanel from './FloatingPanel';

const mockOnClose = jest.fn();

const MockComponent = () => {
  const [close, setClose] = React.useState(false);

  return (
    <div>
      <button onClick={() => setClose(true)} type="button">
        Close
      </button>
      <FloatingPanel anchors={[0, 40, 100]} forceClose={close} onClose={mockOnClose} title="mock-title">
        <div>children</div>
      </FloatingPanel>
    </div>
  );
};

async function mockDrag(el: Element, startY: number, endY: number) {
  fireEvent.mouseDown(el, {
    buttons: 1,
    clientY: startY,
  });
  fireEvent.mouseMove(el, {
    buttons: 1,
    clientY: endY,
  });
  fireEvent.mouseUp(el);
}

describe('test FloatingPanel', () => {
  beforeEach(() => {
    mockOnClose.mockReset();
  });

  it('should render correctly', () => {
    const { container } = render(
      <FloatingPanel
        anchors={[0, 40, 100]}
        className="mock-class"
        fixedContent={<div>fixed</div>}
        onClose={mockOnClose}
        title="mock-title"
      >
        <div>children</div>
      </FloatingPanel>,
    );

    expect(container).toMatchSnapshot();
  });

  it('should behave correctly when changing height', async () => {
    const { container } = render(
      <FloatingPanel anchors={[0, 40, 100]} onClose={mockOnClose} title="mock-title">
        <div>children</div>
      </FloatingPanel>,
    );
    const panelEl = container.querySelector('.adm-floating-panel') as HTMLElement;

    // antd init height = first anchor
    expect(panelEl.style.transform).toBe('translateY(calc(100% + (0px)))');
    expect(panelEl.style.height).toBe('0px');
    // update height = second anchor
    await waitFor(() => expect(panelEl.style.transform).toBe('translateY(calc(100% + (-40px)))'));
    await waitFor(() => expect(panelEl.getAttribute('data-animating')).toBe('false'));
    expect(Math.round(Number(panelEl.style.height.slice(0, -2)))).toBe(40);

    const draggableBar = container.querySelector('.adm-floating-panel .adm-floating-panel-header');

    mockDrag(draggableBar, 0, -80);
    await waitFor(() => expect(panelEl.style.transform).toBe('translateY(calc(100% + (-100px)))'));
    await waitFor(() => expect(panelEl.getAttribute('data-animating')).toBe('false'));
    expect(Math.round(Number(panelEl.style.height.slice(0, -2)))).toBe(100);
    expect(mockOnClose).not.toHaveBeenCalled();
    mockDrag(draggableBar, 0, 100);
    await waitFor(() => expect(panelEl.style.transform).toBe('translateY(calc(100% + (0px)))'));
    await waitFor(() => expect(panelEl.getAttribute('data-animating')).toBe('false'));
    expect(Number(panelEl.style.height.slice(0, -2)) === 0).toBeTruthy();
    await waitFor(() => expect(mockOnClose).toHaveBeenCalledTimes(1));
  });

  it('should close when close is true', async () => {
    const { container } = render(<MockComponent />);
    const panelEl = container.querySelector('.adm-floating-panel') as HTMLElement;

    await waitFor(() => expect(panelEl.style.transform).toBe('translateY(calc(100% + (-40px)))'));
    expect(mockOnClose).not.toHaveBeenCalled();

    const btn = container.querySelector('button');

    fireEvent.click(btn);
    await waitFor(() => expect(panelEl.style.transform).toBe('translateY(calc(100% + (0px)))'));
    await waitFor(() => expect(mockOnClose).toHaveBeenCalledTimes(1));
  });

  it('should close when clicking close button', async () => {
    const { container } = render(
      <FloatingPanel anchors={[0, 40, 100]} onClose={mockOnClose} title="mock-title">
        <div>children</div>
      </FloatingPanel>,
    );
    const panelEl = container.querySelector('.adm-floating-panel') as HTMLElement;

    await waitFor(() => expect(panelEl.style.transform).toBe('translateY(calc(100% + (-40px)))'));
    expect(mockOnClose).not.toHaveBeenCalled();

    const close = container.querySelector('.close-icon');

    fireEvent.click(close);
    await waitFor(() => expect(panelEl.style.transform).toBe('translateY(calc(100% + (0px)))'));
    await waitFor(() => expect(mockOnClose).toHaveBeenCalledTimes(1));
  });
});
