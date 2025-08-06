// Ruler.test.tsx
import React from 'react';

import { render } from '@testing-library/react';

const mockUseGlobalPreferenceStore = jest.fn();

jest.mock('@core/app/stores/globalPreferenceStore', () => ({
  useGlobalPreferenceStore: (...args) => mockUseGlobalPreferenceStore(...args),
}));

const mockCreateEventEmitter = jest.fn();

jest.mock('@core/helpers/eventEmitterFactory', () => ({
  createEventEmitter: (...args) => mockCreateEventEmitter(...args),
}));

const mockGet = jest.fn();

jest.mock('@core/implementations/storage', () => ({
  get: (...args) => mockGet(...args),
}));
jest.mock('@core/app/svgedit/workarea', () => ({
  canvasExpansion: 1,
  height: 600,
  width: 800,
  zoomRatio: 1,
}));

const mockEmitter = {
  off: jest.fn(),
  on: jest.fn(),
};

import Ruler from './Ruler';

describe('Ruler Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGlobalPreferenceStore.mockReturnValue(true);
    mockGet.mockReturnValue('mm');
    mockCreateEventEmitter.mockReturnValue(mockEmitter);
  });

  test('renders the Ruler component', () => {
    const { container, getByText } = render(<Ruler />);

    expect(getByText('mm')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  test('hides the rulers when show_rulers preference is false', () => {
    mockUseGlobalPreferenceStore.mockReturnValue(false);

    const { container } = render(<Ruler />);

    expect(container.querySelector('#rulers')).toHaveStyle('display: none');
  });

  test('calls updateRulers on and zoom-changed events', () => {
    render(<Ruler />);
    expect(mockEmitter.on).toHaveBeenCalledTimes(1);
    expect(mockEmitter.on).toHaveBeenNthCalledWith(1, 'zoom-changed', expect.any(Function));
  });
});
