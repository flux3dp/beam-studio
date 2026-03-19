import React from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react';

const mockGetLetterSpacing = jest.fn();
const mockSetLetterSpacing = jest.fn();
let mockIsMobile = false;

jest.mock('@core/app/svgedit/text/textedit', () => ({
  getLetterSpacing: (...args: any[]) => mockGetLetterSpacing(...args),
  setLetterSpacing: (...args: any[]) => mockSetLetterSpacing(...args),
}));

jest.mock('@core/helpers/system-helper', () => ({
  useIsMobile: () => mockIsMobile,
}));

jest.mock('@core/app/icons/option-panel/OptionPanelIcons', () => ({
  LetterSpacing: () => <span data-testid="letter-spacing-icon" />,
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

import LetterSpacingBlock from './LetterSpacingBlock';

describe('LetterSpacingBlock', () => {
  const mockTextElement = document.createElementNS('http://www.w3.org/2000/svg', 'text') as unknown as SVGTextElement;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsMobile = false;
    mockGetLetterSpacing.mockReturnValue(0);
  });

  test('should render desktop OptionsInput with letter spacing value', () => {
    mockGetLetterSpacing.mockReturnValue(0.1);

    const { getByTestId } = render(<LetterSpacingBlock textElements={[mockTextElement]} />);
    const wrapper = getByTestId('desktop-input-wrapper');

    expect(wrapper.textContent).toContain('value:0.1');
    expect(wrapper.textContent).toContain('multi:false');
  });

  test('should render mobile ObjectPanelItem.Number when isMobile', () => {
    mockIsMobile = true;
    mockGetLetterSpacing.mockReturnValue(0.2);

    const { getByTestId } = render(<LetterSpacingBlock textElements={[mockTextElement]} />);
    const wrapper = getByTestId('mobile-number');

    expect(wrapper.textContent).toContain('value:0.2');
    expect(wrapper.textContent).toContain('multi:false');
  });

  test('should detect multi-value when elements have different letter spacing', () => {
    const textElem1 = document.createElementNS('http://www.w3.org/2000/svg', 'text') as unknown as SVGTextElement;
    const textElem2 = document.createElementNS('http://www.w3.org/2000/svg', 'text') as unknown as SVGTextElement;

    mockGetLetterSpacing.mockImplementation((el) => (el === textElem1 ? 0.1 : 0.3));

    const { getByTestId } = render(<LetterSpacingBlock textElements={[textElem1, textElem2]} />);

    expect(getByTestId('desktop-input-wrapper').textContent).toContain('multi:true');
  });

  test('should call setLetterSpacing and onSizeChange on change', () => {
    const mockOnSizeChange = jest.fn();

    const { getByTestId } = render(
      <LetterSpacingBlock onSizeChange={mockOnSizeChange} textElements={[mockTextElement]} />,
    );

    fireEvent.change(getByTestId('desktop-input'), { target: { value: '0.5' } });

    expect(mockSetLetterSpacing).toHaveBeenCalledWith(0.5, [mockTextElement]);
    expect(mockOnSizeChange).toHaveBeenCalled();
  });

  test('should call setLetterSpacing on mobile input change', () => {
    mockIsMobile = true;

    const mockOnSizeChange = jest.fn();

    const { getByTestId } = render(
      <LetterSpacingBlock onSizeChange={mockOnSizeChange} textElements={[mockTextElement]} />,
    );

    fireEvent.change(getByTestId('mobile-input'), { target: { value: '0.3' } });

    expect(mockSetLetterSpacing).toHaveBeenCalledWith(0.3, [mockTextElement]);
    expect(mockOnSizeChange).toHaveBeenCalled();
  });

  test('should work without onSizeChange callback', () => {
    const { getByTestId } = render(<LetterSpacingBlock textElements={[mockTextElement]} />);

    fireEvent.change(getByTestId('desktop-input'), { target: { value: '0.5' } });

    expect(mockSetLetterSpacing).toHaveBeenCalledWith(0.5, [mockTextElement]);
  });

  test('should update state when letter-spacing attribute mutates', async () => {
    const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text') as unknown as SVGTextElement;

    mockGetLetterSpacing.mockReturnValue(0);

    const { getByTestId } = render(<LetterSpacingBlock textElements={[textEl]} />);

    expect(getByTestId('desktop-input-wrapper').textContent).toContain('value:0');

    mockGetLetterSpacing.mockReturnValue(0.5);
    textEl.setAttribute('letter-spacing', '0.5em');

    await waitFor(() => {
      expect(getByTestId('desktop-input-wrapper').textContent).toContain('value:0.5');
    });
  });

  test('should disconnect observer on unmount', () => {
    const disconnectSpy = jest.spyOn(MutationObserver.prototype, 'disconnect');

    const { unmount } = render(<LetterSpacingBlock textElements={[mockTextElement]} />);

    unmount();

    expect(disconnectSpy).toHaveBeenCalled();
    disconnectSpy.mockRestore();
  });
});
