import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import Input from './Input';
import { MiscEvents } from '@core/app/constants/ipcEvents';

const mockSend = jest.fn();

jest.mock('@core/implementations/communicator', () => ({
  send: (...args) => mockSend(...args),
}));

describe('test Input', () => {
  it('should set editing input when onFocus', () => {
    const { container } = render(<Input />);

    fireEvent.focus(container.querySelector('input'));
    expect(mockSend).toHaveBeenCalledWith(MiscEvents.SetEditingStandardInput, true);
  });

  it('should stop editing input when onBlur', () => {
    const { container } = render(<Input />);

    fireEvent.blur(container.querySelector('input'));
    expect(mockSend).toHaveBeenCalledWith(MiscEvents.SetEditingStandardInput, false);
  });

  it('should stop editing input when unmount', () => {
    const { unmount } = render(<Input />);

    unmount();
    expect(mockSend).toHaveBeenCalledWith(MiscEvents.SetEditingStandardInput, false);
  });
});
