import React from 'react';

import { act, fireEvent, render } from '@testing-library/react';

const mockSetHasUnsavedChanges = jest.fn();

jest.mock('@core/app/svgedit/currentFileManager', () => ({
  setHasUnsavedChanges: mockSetHasUnsavedChanges,
}));

const mockToggleUnsavedChangedDialog = jest.fn();

jest.mock('@core/helpers/file/export', () => ({
  toggleUnsavedChangedDialog: mockToggleUnsavedChangedDialog,
}));

const mockReload = jest.fn();

Object.defineProperty(window, 'location', {
  value: {
    ...window.location,
    reload: mockReload,
  },
  writable: true,
});

import WelcomePageButton from './WelcomePageButton';

describe('test WelcomePageButton', () => {
  it('should render correctly', async () => {
    const { container } = render(<WelcomePageButton />);

    expect(container).toMatchSnapshot();

    const button = container.querySelector('.button');

    mockToggleUnsavedChangedDialog.mockResolvedValue(false);
    await act(() => fireEvent.click(button));
    expect(mockToggleUnsavedChangedDialog).toHaveBeenCalledTimes(1);
    expect(mockSetHasUnsavedChanges).not.toHaveBeenCalled();
    expect(mockReload).not.toHaveBeenCalled();
    expect(window.location.hash).toBe('');

    mockToggleUnsavedChangedDialog.mockResolvedValue(true);
    await act(() => fireEvent.click(button));
    expect(mockToggleUnsavedChangedDialog).toHaveBeenCalledTimes(2);
    expect(mockSetHasUnsavedChanges).toHaveBeenCalledTimes(1);
    expect(mockReload).toHaveBeenCalledTimes(1);
    expect(window.location.hash).toBe('#/studio/welcome');
  });
});
