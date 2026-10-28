import React from 'react';

import { fireEvent, render } from '@testing-library/react';

const mockShortcutHandlers: Record<string, () => void> = {};

jest.mock('@core/helpers/shortcuts', () => ({
  on: (keys: string[], handler: () => void) => {
    keys.forEach((key) => {
      mockShortcutHandlers[key] = handler;
    });

    return () => {
      keys.forEach((key) => {
        if (mockShortcutHandlers[key] === handler) delete mockShortcutHandlers[key];
      });
    };
  },
}));

import LeftPanelButtonGroup from './LeftPanelButtonGroup';

const makeOptions = (onText: () => void, onFitText: () => void) => [
  { icon: <span>T</span>, id: 'Text', label: 'Text', onClick: onText },
  { icon: <span>F</span>, id: 'FitText', label: 'Fit Text', onClick: onFitText },
];

describe('test LeftPanelButtonGroup', () => {
  it('should call the latest onClick of the selected option after options change', () => {
    const oldText = jest.fn();
    const newText = jest.fn();
    const { container, rerender } = render(
      <LeftPanelButtonGroup id="left-Text" options={makeOptions(oldText, jest.fn())} shortcut="T" />,
    );

    rerender(<LeftPanelButtonGroup id="left-Text" options={makeOptions(newText, jest.fn())} shortcut="T" />);

    fireEvent.click(container.querySelector('#left-Text')!);
    expect(newText).toHaveBeenCalledTimes(1);
    expect(oldText).not.toHaveBeenCalled();

    mockShortcutHandlers.t();
    expect(newText).toHaveBeenCalledTimes(2);
    expect(oldText).not.toHaveBeenCalled();
  });

  it('should keep the selected option across options changes', () => {
    const oldFitText = jest.fn();
    const newFitText = jest.fn();
    const { container, getByText, rerender } = render(
      <LeftPanelButtonGroup id="left-Text" options={makeOptions(jest.fn(), oldFitText)} />,
    );

    fireEvent.contextMenu(container.querySelector('#left-Text')!);
    fireEvent.mouseUp(getByText('Fit Text'));
    expect(oldFitText).toHaveBeenCalledTimes(1);

    rerender(<LeftPanelButtonGroup id="left-Text" options={makeOptions(jest.fn(), newFitText)} />);
    fireEvent.click(container.querySelector('#left-Text')!);
    expect(newFitText).toHaveBeenCalledTimes(1);
    expect(oldFitText).toHaveBeenCalledTimes(1);
  });
});
