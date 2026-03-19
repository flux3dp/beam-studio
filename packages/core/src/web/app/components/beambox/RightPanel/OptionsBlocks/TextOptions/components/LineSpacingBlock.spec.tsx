import React from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react';

const mockGetLineSpacing = jest.fn();
const mockSetLineSpacing = jest.fn();
let mockIsMobile = false;

jest.mock('@core/app/svgedit/text/textedit', () => ({
  getLineSpacing: (...args: any[]) => mockGetLineSpacing(...args),
  setLineSpacing: (...args: any[]) => mockSetLineSpacing(...args),
}));

jest.mock('@core/helpers/system-helper', () => ({
  useIsMobile: () => mockIsMobile,
}));

jest.mock('@core/app/icons/option-panel/OptionPanelIcons', () => ({
  LineSpacing: () => <span data-testid="line-spacing-icon" />,
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

import LineSpacingBlock from './LineSpacingBlock';

describe('LineSpacingBlock', () => {
  const mockTextElement = document.createElementNS('http://www.w3.org/2000/svg', 'text') as unknown as SVGTextElement;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsMobile = false;
    mockGetLineSpacing.mockReturnValue(1);
  });

  test('should render desktop OptionsInput with line spacing value', () => {
    const { getByTestId } = render(<LineSpacingBlock textElements={[mockTextElement]} />);
    const wrapper = getByTestId('desktop-input-wrapper');

    expect(wrapper.textContent).toContain('value:1');
    expect(wrapper.textContent).toContain('multi:false');
  });

  test('should render mobile ObjectPanelItem.Number when isMobile', () => {
    mockIsMobile = true;
    mockGetLineSpacing.mockReturnValue(1.5);

    const { getByTestId } = render(<LineSpacingBlock textElements={[mockTextElement]} />);
    const wrapper = getByTestId('mobile-number');

    expect(wrapper.textContent).toContain('value:1.5');
    expect(wrapper.textContent).toContain('multi:false');
  });

  test('should detect multi-value when elements have different line spacing', () => {
    const textElem1 = document.createElementNS('http://www.w3.org/2000/svg', 'text') as unknown as SVGTextElement;
    const textElem2 = document.createElementNS('http://www.w3.org/2000/svg', 'text') as unknown as SVGTextElement;

    mockGetLineSpacing.mockImplementation((el) => (el === textElem1 ? 1.0 : 1.5));

    const { getByTestId } = render(<LineSpacingBlock textElements={[textElem1, textElem2]} />);

    expect(getByTestId('desktop-input-wrapper').textContent).toContain('multi:true');
  });

  test('should call setLineSpacing and onSizeChange on change', () => {
    const mockOnSizeChange = jest.fn();

    const { getByTestId } = render(<LineSpacingBlock onSizeChange={mockOnSizeChange} textElements={[mockTextElement]} />);

    fireEvent.change(getByTestId('desktop-input'), { target: { value: '1.5' } });

    expect(mockSetLineSpacing).toHaveBeenCalledWith(1.5, [mockTextElement]);
    expect(mockOnSizeChange).toHaveBeenCalled();
  });

  test('should call setLineSpacing on mobile input change', () => {
    mockIsMobile = true;

    const mockOnSizeChange = jest.fn();

    const { getByTestId } = render(<LineSpacingBlock onSizeChange={mockOnSizeChange} textElements={[mockTextElement]} />);

    fireEvent.change(getByTestId('mobile-input'), { target: { value: '2' } });

    expect(mockSetLineSpacing).toHaveBeenCalledWith(2, [mockTextElement]);
    expect(mockOnSizeChange).toHaveBeenCalled();
  });

  test('should work without onSizeChange callback', () => {
    const { getByTestId } = render(<LineSpacingBlock textElements={[mockTextElement]} />);

    fireEvent.change(getByTestId('desktop-input'), { target: { value: '1.5' } });

    expect(mockSetLineSpacing).toHaveBeenCalledWith(1.5, [mockTextElement]);
  });

  test('should update state when data-line-spacing attribute mutates', async () => {
    const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text') as unknown as SVGTextElement;

    mockGetLineSpacing.mockReturnValue(1);

    const { getByTestId } = render(<LineSpacingBlock textElements={[textEl]} />);

    expect(getByTestId('desktop-input-wrapper').textContent).toContain('value:1');

    mockGetLineSpacing.mockReturnValue(2);
    textEl.setAttribute('data-line-spacing', '2');

    await waitFor(() => {
      expect(getByTestId('desktop-input-wrapper').textContent).toContain('value:2');
    });
  });

  test('should disconnect observer on unmount', () => {
    const disconnectSpy = jest.spyOn(MutationObserver.prototype, 'disconnect');

    const { unmount } = render(<LineSpacingBlock textElements={[mockTextElement]} />);

    unmount();

    expect(disconnectSpy).toHaveBeenCalled();
    disconnectSpy.mockRestore();
  });
});
