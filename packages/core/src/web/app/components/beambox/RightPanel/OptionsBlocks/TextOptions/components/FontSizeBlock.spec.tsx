import React from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react';

const mockGetFontSize = jest.fn();
const mockSetFontSize = jest.fn();
let mockIsMobile = false;

jest.mock('@core/app/svgedit/text/textedit', () => ({
  getFontSize: (...args: any[]) => mockGetFontSize(...args),
  setFontSize: (...args: any[]) => mockSetFontSize(...args),
}));

jest.mock('@core/helpers/system-helper', () => ({
  useIsMobile: () => mockIsMobile,
}));

jest.mock('@core/app/components/beambox/RightPanel/ObjectPanelItem', () => ({
  Number: ({ hasMultiValue, id, label, updateValue, value }: any) => (
    <div data-testid="mobile-number">
      mock-number id:{id} label:{label} value:{value} multi:{String(hasMultiValue)}
      <input data-testid="mobile-input" onChange={(e) => updateValue(+e.target.value)} />
    </div>
  ),
}));

jest.mock('../../OptionsInput', () => ({ displayMultiValue, id, onChange, value }: any) => (
  <div data-testid="desktop-input-wrapper">
    mock-options-input id:{id} value:{value} multi:{String(displayMultiValue)}
    <input data-testid="desktop-input" onChange={(e) => onChange(+e.target.value)} />
  </div>
));

import FontSizeBlock from './FontSizeBlock';

describe('FontSizeBlock', () => {
  const mockTextElement = document.createElementNS('http://www.w3.org/2000/svg', 'text') as unknown as SVGTextElement;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsMobile = false;
    mockGetFontSize.mockReturnValue(20);
  });

  test('should render desktop OptionsInput with font size value', () => {
    const { getByTestId } = render(<FontSizeBlock textElements={[mockTextElement]} />);
    const wrapper = getByTestId('desktop-input-wrapper');

    expect(wrapper.textContent).toContain('value:20');
    expect(wrapper.textContent).toContain('multi:false');
  });

  test('should render mobile ObjectPanelItem.Number when isMobile', () => {
    mockIsMobile = true;

    const { getByTestId } = render(<FontSizeBlock textElements={[mockTextElement]} />);
    const wrapper = getByTestId('mobile-number');

    expect(wrapper.textContent).toContain('value:20');
    expect(wrapper.textContent).toContain('multi:false');
  });

  test('should detect multi-value when elements have different font sizes', () => {
    const textElem1 = document.createElementNS('http://www.w3.org/2000/svg', 'text') as unknown as SVGTextElement;
    const textElem2 = document.createElementNS('http://www.w3.org/2000/svg', 'text') as unknown as SVGTextElement;

    mockGetFontSize.mockImplementation((el) => (el === textElem1 ? 20 : 30));

    const { getByTestId } = render(<FontSizeBlock textElements={[textElem1, textElem2]} />);

    expect(getByTestId('desktop-input-wrapper').textContent).toContain('multi:true');
  });

  test('should call setFontSize and onSizeChange on change', () => {
    const mockOnSizeChange = jest.fn();

    const { getByTestId } = render(<FontSizeBlock onSizeChange={mockOnSizeChange} textElements={[mockTextElement]} />);

    fireEvent.change(getByTestId('desktop-input'), { target: { value: '48' } });

    expect(mockSetFontSize).toHaveBeenCalledWith(48, [mockTextElement]);
    expect(mockOnSizeChange).toHaveBeenCalled();
  });

  test('should call setFontSize on mobile input change', () => {
    mockIsMobile = true;

    const mockOnSizeChange = jest.fn();

    const { getByTestId } = render(<FontSizeBlock onSizeChange={mockOnSizeChange} textElements={[mockTextElement]} />);

    fireEvent.change(getByTestId('mobile-input'), { target: { value: '36' } });

    expect(mockSetFontSize).toHaveBeenCalledWith(36, [mockTextElement]);
    expect(mockOnSizeChange).toHaveBeenCalled();
  });

  test('should work without onSizeChange callback', () => {
    const { getByTestId } = render(<FontSizeBlock textElements={[mockTextElement]} />);

    fireEvent.change(getByTestId('desktop-input'), { target: { value: '48' } });

    expect(mockSetFontSize).toHaveBeenCalledWith(48, [mockTextElement]);
  });

  test('should update state when font-size attribute mutates', async () => {
    const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text') as unknown as SVGTextElement;

    mockGetFontSize.mockReturnValue(20);

    const { getByTestId } = render(<FontSizeBlock textElements={[textEl]} />);

    expect(getByTestId('desktop-input-wrapper').textContent).toContain('value:20');

    // Simulate external mutation (e.g. fitText resize)
    mockGetFontSize.mockReturnValue(42);
    textEl.setAttribute('font-size', '42');

    await waitFor(() => {
      expect(getByTestId('desktop-input-wrapper').textContent).toContain('value:42');
    });
  });

  test('should disconnect observer on unmount', () => {
    const disconnectSpy = jest.spyOn(MutationObserver.prototype, 'disconnect');

    const { unmount } = render(<FontSizeBlock textElements={[mockTextElement]} />);

    unmount();

    expect(disconnectSpy).toHaveBeenCalled();
    disconnectSpy.mockRestore();
  });
});
