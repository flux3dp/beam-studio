import React, { act, useCallback, useState } from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react';

const mockAddToHistory = jest.fn();
const mockOnClose = jest.fn();
const mockOnElementSelect = jest.fn();

jest.mock('@core/app/contexts/ElementPanelContext', () => ({
  ElementPanelContext: React.createContext({
    addToHistory: mockAddToHistory,
    onClose: mockOnClose,
    onElementSelect: mockOnElementSelect,
  }),
}));

const mockForceUpdate = jest.fn();

jest.mock('@core/helpers/use-force-update', () => (): (() => void) => {
  const [, setVal] = useState(0);
  const forceUpdate = useCallback(() => {
    setVal((v) => v + 1);
    mockForceUpdate();
  }, []);

  return forceUpdate;
});

const MockIconComponent = () => 'svgr-url';
const mockImportIcon = jest.fn();

jest.mock('./importIcon', () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockImportIcon(...args),
}));

import BuiltinElement from './BuiltinElement';

describe('test BuiltinElement', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockImportIcon.mockResolvedValue(MockIconComponent);
  });

  it('should render correctly', async () => {
    const { container } = render(<BuiltinElement mainType="basic" path="mock-icon" />);

    expect(container).toBeEmptyDOMElement();
    await waitFor(() => expect(mockForceUpdate).toHaveBeenCalled());
    expect(container).not.toBeEmptyDOMElement();
    expect(container).toMatchSnapshot();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should render correctly when mainType missing', async () => {
    const { container } = render(<BuiltinElement path="basic/mock-icon2" />);

    expect(container).toBeEmptyDOMElement();
    await waitFor(() => expect(mockForceUpdate).toHaveBeenCalled());
    expect(container).not.toBeEmptyDOMElement();
    expect(container).toMatchSnapshot();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should render null when icon not found', async () => {
    mockImportIcon.mockRejectedValueOnce(new Error("Cannot find module './basic/mock-null.svg'"));

    const errorLog = jest.spyOn(console, 'error');
    const { container } = render(<BuiltinElement mainType="basic" path="mock-null" />);

    await waitFor(() => {
      expect(errorLog).toHaveBeenCalledTimes(1);
      expect(errorLog).toHaveBeenCalledWith(
        "Fail to load icon from '@core/app/icons/shape/basic/mock-null.svg': Error: Cannot find module './basic/mock-null.svg'",
      );
    });
    expect(container).toBeEmptyDOMElement();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should call onElementSelect and onClose on click', async () => {
    const { container } = render(<BuiltinElement mainType="basic" path="mock-icon" />);

    await waitFor(() => expect(mockForceUpdate).toHaveBeenCalled());
    await act(async () => {
      fireEvent.click(container.querySelector('.icon')!);
    });
    expect(mockAddToHistory).toHaveBeenCalledTimes(1);
    expect(mockAddToHistory).toHaveBeenCalledWith({
      path: { fileName: 'mock-icon', folder: 'basic' },
      type: 'builtin',
    });
    expect(mockOnElementSelect).toHaveBeenCalledTimes(1);
    expect(mockOnElementSelect).toHaveBeenCalledWith('basic/mock-icon');
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
