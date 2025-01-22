import React from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react';

import ShapePanel from './ShapePanel';

window.innerHeight = 667;

jest.mock('@core/app/constants/shape-panel-constants', () => {
  const originalModule = jest.requireActual('@core/app/constants/shape-panel-constants');

  return {
    __esModule: true,
    ...originalModule,
    default: {
      basic: {
        graphics: { fileNames: ['icon-minus'] },
        shape: { fileNames: ['icon-circle', 'icon-triangle'] },
      },
      decor: {
        circular: { setting: { end: 2, reverseIndex: [2] } },
        corner: { setting: { end: 3, reverseIndex: [1], twoVersion: true } },
      },
    },
    ShapeTabs: ['basic', 'decor'],
  };
});

jest.mock('@core/app/views/beambox/ShapePanel/ShapeIcon', () => ({ activeTab, fileName, onClose }: any) => (
  <div>
    mock shape icon: activeTab: {activeTab}
    fileName: {fileName}
    <button onClick={onClose} type="button">
      Import Icon
    </button>
  </div>
));

jest.mock('@core/helpers/useI18n', () => () => ({
  beambox: {
    shapes_panel: {
      basic: 'Basic',
      circular: 'Circular',
      corner: 'Corner',
      decor: 'Decor',
      graphics: 'Graphics',
      shape: 'Shape',
      title: 'Elements',
    },
  },
}));

const useIsMobile = jest.fn();

jest.mock('@core/helpers/system-helper', () => ({
  useIsMobile: () => useIsMobile(),
}));

const mockOnClose = jest.fn();

describe('test ShapePanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { baseElement, getByText } = render(<ShapePanel onClose={mockOnClose} />);

    expect(baseElement).toMatchSnapshot();
    fireEvent.click(getByText('Decor'));
    expect(baseElement).toMatchSnapshot();
    expect(mockOnClose).not.toBeCalled();
  });

  it('should close modal after import', async () => {
    const { baseElement, getAllByText } = render(<ShapePanel onClose={mockOnClose} />);
    const modalEl = baseElement.querySelector('.ant-modal-wrap') as HTMLElement;

    expect(modalEl).toBeVisible();
    expect(mockOnClose).not.toBeCalled();

    const shapeIcons = getAllByText('Import Icon');

    expect(shapeIcons.length).toBe(3);
    fireEvent.click(shapeIcons[0]);
    await waitFor(() => expect(modalEl).not.toBeVisible());
    expect(mockOnClose).toBeCalledTimes(1);
  });
});

describe('test ShapePanel in mobile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useIsMobile.mockReturnValue(true);
  });

  it('should render correctly', async () => {
    const { container, getByText } = render(<ShapePanel onClose={mockOnClose} />);
    const panelEl = container.querySelector('.adm-floating-panel') as HTMLElement;

    await waitFor(() => expect(panelEl.style.transform).toBe('translateY(calc(100% + (-627px)))'), {
      timeout: 3000,
    });
    await waitFor(() => expect(panelEl.getAttribute('data-animating')).toBe('false'));
    expect(container).toMatchSnapshot();
    fireEvent.click(getByText('Decor'));
    expect(container).toMatchSnapshot();
    expect(mockOnClose).not.toBeCalled();
  });

  it('should close modal after import', async () => {
    const { container, getAllByText, getByText } = render(<ShapePanel onClose={mockOnClose} />);
    const panelEl = container.querySelector('.adm-floating-panel') as HTMLElement;

    await waitFor(() => expect(panelEl.style.transform).toBe('translateY(calc(100% + (-627px)))'));
    expect(mockOnClose).not.toBeCalled();
    fireEvent.click(getByText('Decor'));

    const shapeIcons = getAllByText('Import Icon');

    expect(shapeIcons.length).toBe(8);
    fireEvent.click(shapeIcons[0]);
    await waitFor(() => expect(panelEl.style.transform).toBe('translateY(calc(100% + (0px)))'));
    expect(mockOnClose).toBeCalled();
  });
});
