import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { useScreenStore } from '@core/app/stores/screenStore';

const mockAddCommandToHistory = jest.fn();

jest.mock('@core/app/svgedit/history/undoManager', () => ({
  addCommandToHistory: (...args: any[]) => mockAddCommandToHistory(...args),
}));

const mockCalcElemFilledInfo = jest.fn();

jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync: (callback: any) =>
    callback({ Canvas: { calcElemFilledInfo: (...args: any[]) => mockCalcElemFilledInfo(...args) } }),
}));

jest.mock('@core/app/components/beambox/RightPanel/ObjectPanelItem', () => ({
  Item: ({ id, label, onClick }: any) => (
    <div data-testid="mobile-item" id={id} onClick={onClick}>
      {label}
    </div>
  ),
}));

import SingleLineFontBlock from './SingleLineFontBlock';

const createText = (attributes: Record<string, string> = {}) => {
  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');

  Object.entries(attributes).forEach(([key, value]) => text.setAttribute(key, value));

  return text as SVGTextElement;
};

describe('SingleLineFontBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useScreenStore.setState({ isMobile: false });
    mockCalcElemFilledInfo.mockReturnValue({ isAllFilled: false, isAnyFilled: false });
  });

  test('turning on marks the texts and unfills the filled ones in one undo step', () => {
    const filled = createText({ fill: '#ff0000', 'fill-opacity': '1' });
    const unfilled = createText({ fill: 'none', stroke: '#000' });
    const onChange = jest.fn();

    mockCalcElemFilledInfo.mockImplementation((elem) => ({
      isAllFilled: elem === filled,
      isAnyFilled: elem === filled,
    }));

    const { container } = render(
      <SingleLineFontBlock checked={false} onChange={onChange} textElements={[filled, unfilled]} />,
    );

    fireEvent.click(container.querySelector('#single-line-font')!);

    expect(filled.getAttribute('data-single-line')).toBe('true');
    expect(filled.getAttribute('fill')).toBe('none');
    expect(filled.getAttribute('fill-opacity')).toBe('0');
    expect(filled.getAttribute('stroke')).toBe('#ff0000');
    expect(unfilled.getAttribute('data-single-line')).toBe('true');
    expect(unfilled.getAttribute('stroke')).toBe('#000');
    expect(onChange).toHaveBeenCalledWith(true);
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory.mock.calls[0][0].isEmpty()).toBe(false);
  });

  test('turning off only removes the attribute', () => {
    const text = createText({ 'data-single-line': 'true', fill: 'none' });
    const onChange = jest.fn();

    useScreenStore.setState({ isMobile: true });

    const { getByTestId } = render(<SingleLineFontBlock checked onChange={onChange} textElements={[text]} />);

    fireEvent.click(getByTestId('mobile-item'));

    expect(text.hasAttribute('data-single-line')).toBe(false);
    expect(text.getAttribute('fill')).toBe('none');
    expect(mockCalcElemFilledInfo).not.toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith(false);
  });
});
