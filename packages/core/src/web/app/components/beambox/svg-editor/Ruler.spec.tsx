// Ruler.test.tsx
import React from 'react';
import { render } from '@testing-library/react';

import Ruler from './Ruler';

// Mock necessary modules
const mockRead = jest.fn();
jest.mock('app/actions/beambox/beambox-preference', () => ({
  read: (...args) => mockRead(...args),
}));
const mockCreateEventEmitter = jest.fn();
jest.mock('helpers/eventEmitterFactory', () => ({
  createEventEmitter: (...args) => mockCreateEventEmitter(...args),
}));
const mockGet = jest.fn();
jest.mock('implementations/storage', () => ({
  get: (...args) => mockGet(...args),
}));
jest.mock('app/svgedit/workarea', () => ({
  canvasExpansion: 1,
  width: 800,
  height: 600,
  zoomRatio: 1,
}));

const mockEmitter = {
  on: jest.fn(),
  off: jest.fn(),
};

describe('Ruler Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRead.mockReturnValue(true);
    mockGet.mockReturnValue('mm');
    mockCreateEventEmitter.mockReturnValue(mockEmitter);
  });

  test('renders the Ruler component', () => {
    const { container, getByText } = render(<Ruler />);

    expect(getByText('mm')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  test('hides the rulers when show_rulers preference is false', () => {
    mockRead.mockReturnValue(false);
    const { container } = render(<Ruler />);
    expect(container.querySelector('#rulers')).toHaveStyle('display: none');
  });

  test('calls updateRulers on update-ruler and zoom-changed events', () => {
    render(<Ruler />);
    expect(mockEmitter.on).toHaveBeenCalledTimes(2);
    expect(mockEmitter.on).toHaveBeenNthCalledWith(1, 'update-ruler', expect.any(Function));
    expect(mockEmitter.on).toHaveBeenNthCalledWith(2, 'zoom-changed', expect.any(Function));
  });
});
