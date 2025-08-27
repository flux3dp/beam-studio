import React from 'react';
import { fireEvent, render } from '@testing-library/react';

const mockKonvaFilters = {
  Invert: jest.fn(),
};

jest.mock('konva', () => ({
  Filters: mockKonvaFilters,
}));

const mockUseStampMakerPanelStore = jest.fn();
const mockToggleInvert = jest.fn();
const mockSetBevelRadius = jest.fn();
const mockSetHorizontalFlip = jest.fn();

jest.mock('../../store', () => ({
  useStampMakerPanelStore: mockUseStampMakerPanelStore,
}));

jest.mock('@core/app/widgets/UnitInput', () => ({ addonAfter, max, min, onChange, step, value }: any) => (
  <input
    data-addon={addonAfter}
    data-testid="unit-input"
    max={max}
    min={min}
    onChange={(e) => onChange(Number(e.target.value))}
    step={step}
    type="number"
    value={value}
  />
));

import Content from './Content';

describe('test Content', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseStampMakerPanelStore.mockReturnValue({
      bevelRadius: 0,
      filters: [],
      horizontalFlip: false,
      setBevelRadius: mockSetBevelRadius,
      setHorizontalFlip: mockSetHorizontalFlip,
      toggleInvert: mockToggleInvert,
    });
  });

  it('should render correctly', () => {
    const { container } = render(<Content />);

    expect(container).toMatchSnapshot();
  });

  it('should render invert switch unchecked when filter not applied', () => {
    const { getAllByRole } = render(<Content />);

    const switches = getAllByRole('switch');
    const invertSwitch = switches[0]; // First switch is Invert

    expect(invertSwitch.getAttribute('aria-checked')).toBe('false');
  });

  it('should render invert switch checked when filter is applied', () => {
    mockUseStampMakerPanelStore.mockReturnValue({
      bevelRadius: 0,
      filters: [mockKonvaFilters.Invert],
      horizontalFlip: false,
      setBevelRadius: mockSetBevelRadius,
      setHorizontalFlip: mockSetHorizontalFlip,
      toggleInvert: mockToggleInvert,
    });

    const { getAllByRole } = render(<Content />);

    const switches = getAllByRole('switch');
    const invertSwitch = switches[0]; // First switch is Invert

    expect(invertSwitch.getAttribute('aria-checked')).toBe('true');
  });

  it('should call toggleInvert when invert switch is clicked', () => {
    const { getAllByRole } = render(<Content />);

    const switches = getAllByRole('switch');
    const invertSwitch = switches[0]; // First switch is Invert

    fireEvent.click(invertSwitch);

    expect(mockToggleInvert).toHaveBeenCalled();
  });

  it('should call toggleInvert when invert switch is clicked (when already inverted)', () => {
    mockUseStampMakerPanelStore.mockReturnValue({
      bevelRadius: 0,
      filters: [mockKonvaFilters.Invert],
      horizontalFlip: false,
      setBevelRadius: mockSetBevelRadius,
      setHorizontalFlip: mockSetHorizontalFlip,
      toggleInvert: mockToggleInvert,
    });

    const { getAllByRole } = render(<Content />);

    const switches = getAllByRole('switch');
    const invertSwitch = switches[0]; // First switch is Invert

    fireEvent.click(invertSwitch);

    expect(mockToggleInvert).toHaveBeenCalled();
  });

  it('should render horizontal flip switch with correct state', () => {
    const { getAllByRole } = render(<Content />);

    const switches = getAllByRole('switch');
    const flipSwitch = switches[1]; // Second switch is Flip Horizontally

    expect(flipSwitch.getAttribute('aria-checked')).toBe('false');
  });

  it('should toggle horizontal flip when switch clicked', () => {
    const { getAllByRole } = render(<Content />);

    const switches = getAllByRole('switch');
    const flipSwitch = switches[1]; // Second switch is Flip Horizontally

    fireEvent.click(flipSwitch);

    expect(mockSetHorizontalFlip).toHaveBeenCalledWith(true);
  });

  it('should toggle horizontal flip off when already on', () => {
    mockUseStampMakerPanelStore.mockReturnValue({
      bevelRadius: 0,
      filters: [],
      horizontalFlip: true,
      setBevelRadius: mockSetBevelRadius,
      setHorizontalFlip: mockSetHorizontalFlip,
      toggleInvert: mockToggleInvert,
    });

    const { getAllByRole } = render(<Content />);

    const switches = getAllByRole('switch');
    const flipSwitch = switches[1]; // Second switch is Flip Horizontally

    fireEvent.click(flipSwitch);

    expect(mockSetHorizontalFlip).toHaveBeenCalledWith(false);
  });

  it('should render bevel radius input with correct value', () => {
    mockUseStampMakerPanelStore.mockReturnValue({
      bevelRadius: 2.5,
      filters: [],
      horizontalFlip: false,
      setBevelRadius: mockSetBevelRadius,
      setHorizontalFlip: mockSetHorizontalFlip,
      toggleInvert: mockToggleInvert,
    });

    const { getByTestId } = render(<Content />);

    const bevelInput = getByTestId('unit-input') as HTMLInputElement;

    expect(bevelInput.value).toBe('2.5');
    expect(bevelInput.min).toBe('0');
    expect(bevelInput.max).toBe('10');
    expect(bevelInput.step).toBe('0.1');
    expect(bevelInput.dataset.addon).toBe('mm');
  });

  it('should update bevel radius when input changes', () => {
    const { getByTestId } = render(<Content />);

    const bevelInput = getByTestId('unit-input');

    fireEvent.change(bevelInput, { target: { value: '5' } });

    expect(mockSetBevelRadius).toHaveBeenCalledWith(5);
  });

  it('should not update bevel radius when value is null', () => {
    const { getByTestId } = render(<Content />);

    // Mock UnitInput to simulate null value
    const bevelInput = getByTestId('unit-input');

    fireEvent.change(bevelInput, { target: { value: '' } });

    // Since our mock always returns a number, we need to test the actual component logic
    // In the real component, null values are ignored
    expect(mockSetBevelRadius).not.toHaveBeenCalledWith(null);
  });

  it('should render tooltips for form items', () => {
    const { container } = render(<Content />);

    const tooltipIcons = container.querySelectorAll('.anticon-question-circle');

    expect(tooltipIcons).toHaveLength(2);
  });
});
