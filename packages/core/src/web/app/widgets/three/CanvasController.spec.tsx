import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import CanvasController from './CanvasController';

jest.mock('helpers/useI18n', () => () => ({
  boxgen: {
    reset: 'Reset',
    zoom: 'Zoom',
    control_tooltip: 'Left mouse to rotate\nScroll to zoom\nRight mouse to pan',
    control_tooltip_touch: 'Drag to rotate\nPinch to zoom\nTwo-finger to pan',
  },
}));

let mockZoomKey = 0;
let mockResetKey = 0;
const mockSetZoomKey = jest.fn().mockImplementation((fn) => {
  mockZoomKey = fn(mockZoomKey);
});
const mockSetResetKey = jest.fn().mockImplementation((fn) => {
  mockResetKey = fn(mockResetKey);
});

jest.mock('app/contexts/BoxgenContext', () => ({
  BoxgenContext: React.createContext(null),
}));

describe('test CanvasController', () => {
  test('should behave correctly', () => {
    const { container } = render(<CanvasController setResetKey={mockSetResetKey} setZoomKey={mockSetZoomKey} />);
    expect(container).toMatchSnapshot();
    const buttons = container.querySelectorAll('.button');
    fireEvent.click(buttons[0]);
    expect(mockSetResetKey).toBeCalledTimes(1);
    expect(mockResetKey).toBe(1);
    fireEvent.click(buttons[1]);
    expect(mockSetZoomKey).toBeCalledTimes(1);
    expect(mockZoomKey).toBe(-1);
    fireEvent.click(buttons[1]);
    expect(mockSetZoomKey).toBeCalledTimes(2);
    expect(mockZoomKey).toBe(-2);
    fireEvent.click(buttons[2]);
    expect(mockSetZoomKey).toBeCalledTimes(3);
    expect(mockZoomKey).toBe(3);
  });
});
