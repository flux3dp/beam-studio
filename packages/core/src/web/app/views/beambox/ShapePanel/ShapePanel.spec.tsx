import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';

import ShapePanel from './ShapePanel';

window.innerHeight = 667;

jest.mock('app/constants/shape-panel-constants', () => {
  const originalModule = jest.requireActual('app/constants/shape-panel-constants');
  return {
    __esModule: true,
    ...originalModule,
    ShapeTabs: ['basic', 'decor'],
    default: {
      basic: {
        shape: { fileNames: ['icon-circle', 'icon-triangle'] },
        graphics: { fileNames: ['icon-minus'] },
      },
      decor: {
        circular: { setting: { end: 2, reverseIndex: [2] } },
        corner: { setting: { end: 3, twoVersion: true, reverseIndex: [1] } },
      },
    },
  };
});

jest.mock('app/views/beambox/ShapePanel/ShapeIcon', () =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ({ activeTab, fileName, onClose }: any) => (
    <div>
      mock shape icon: activeTab: {activeTab}
      fileName: {fileName}
      <button type="button" onClick={onClose}>
        Import Icon
      </button>
    </div>
  )
);

jest.mock('helpers/useI18n', () => () => ({
  beambox: {
    shapes_panel: {
      title: 'Elements',
      basic: 'Basic',
      shape: 'Shape',
      graphics: 'Graphics',
      decor: 'Decor',
      circular: 'Circular',
      corner: 'Corner',
    },
  },
}));

const useIsMobile = jest.fn();
jest.mock('helpers/system-helper', () => ({
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
