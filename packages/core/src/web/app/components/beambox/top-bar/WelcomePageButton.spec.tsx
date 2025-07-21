import React from 'react';

import { act, fireEvent, render } from '@testing-library/react';

import WelcomePageButton from './WelcomePageButton';

const mockToggleUnsavedChangedDialog = jest.fn();

jest.mock('@core/helpers/file-export-helper', () => ({
  toggleUnsavedChangedDialog: (...args) => mockToggleUnsavedChangedDialog(...args),
}));

describe('test WelcomePageButton', () => {
  it('should render correctly', async () => {
    const { container } = render(<WelcomePageButton />);

    expect(container).toMatchSnapshot();

    const button = container.querySelector('.button');

    mockToggleUnsavedChangedDialog.mockResolvedValue(false);
    await act(() => fireEvent.click(button));
    expect(mockToggleUnsavedChangedDialog).toHaveBeenCalledTimes(1);
    expect(window.location.hash).toBe('');

    mockToggleUnsavedChangedDialog.mockResolvedValue(true);
    await act(() => fireEvent.click(button));
    expect(mockToggleUnsavedChangedDialog).toHaveBeenCalledTimes(2);
    expect(window.location.hash).toBe('#/studio/welcome');
  });
});
