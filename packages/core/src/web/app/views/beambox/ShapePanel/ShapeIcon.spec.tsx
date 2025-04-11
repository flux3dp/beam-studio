import React, { useCallback, useState } from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react';

import ShapeIcon from './ShapeIcon';

const mockElement = document.createElement('use');
const mockAddSvgElementFromJson = jest.fn().mockReturnValue(mockElement);
const mockGetSvgRealLocation = jest.fn().mockReturnValue({ height: 25, width: 15, x: 15, y: 10 });
const mockSelectOnly = jest.fn();
const mockSetSvgElemPosition = jest.fn();
const mockSetSvgElemSize = jest.fn();
const mockAddCommandToHistory = jest.fn();
const mockGetCurrentLayerName = jest.fn();
const mockGetSelectedElems = jest.fn().mockReturnValue(['mock-path-elem']);

jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync: (callback) =>
    callback({
      Canvas: {
        addCommandToHistory: (...args: any) => mockAddCommandToHistory(...args),
        addSvgElementFromJson: (...args: any) => mockAddSvgElementFromJson(...args),
        getCurrentDrawing: () => ({ getCurrentLayerName: mockGetCurrentLayerName }),
        getNextId: jest.fn(),
        getSelectedElems: () => mockGetSelectedElems(),
        getSvgRealLocation: (...args: any) => mockGetSvgRealLocation(...args),
        isUsingLayerColor: true,
        selectOnly: (...args: any) => mockSelectOnly(...args),
        setSvgElemPosition: (...args: any) => mockSetSvgElemPosition(...args),
        setSvgElemSize: (...args: any) => mockSetSvgElemSize(...args),
      },
    }),
}));

const mockDisassembleUse = jest.fn();

jest.mock(
  '@core/app/svgedit/operations/disassembleUse',
  () =>
    (...args) =>
      mockDisassembleUse(...args),
);

const mockUpdateElementColor = jest.fn();

jest.mock(
  '@core/helpers/color/updateElementColor',
  () =>
    (...args: any) =>
      mockUpdateElementColor(...args),
);

const mockImportSvgString = jest.fn().mockResolvedValue(mockElement);

jest.mock(
  '@core/app/svgedit/operations/import/importSvgString',
  () =>
    (...args: any) =>
      mockImportSvgString(...args),
);

const mockGetData = jest.fn();

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  getData: (...args: any) => mockGetData(...args),
}));

const mockGetLayerByName = jest.fn().mockReturnValue('mock-layer-elem');

jest.mock('@core/helpers/layer/layer-helper', () => ({
  getLayerByName: (...args: any) => mockGetLayerByName(...args),
}));

jest.mock('@core/app/constants/shape-panel-constants', () => ({
  __esModule: true,
  builtInElements: {
    'mock-circle': {
      attr: { cx: 250, cy: 250, 'data-ratiofixed': true, rx: 250, ry: 250 },
      element: 'ellipse',
    },
  },
  default: {
    basic: {
      shape: {
        fileNames: ['mock-circle', 'mock-svg', 'mock-null'],
      },
    },
  },
  ShapeTabs: ['basic'],
}));

const mockUseIsMobile = jest.fn();

jest.mock('@core/helpers/system-helper', () => ({
  useIsMobile: () => mockUseIsMobile(),
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

const mockOnClose = jest.fn();

describe('test ShapeIcon', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', async () => {
    const { container } = render(<ShapeIcon activeTab="basic" fileName="mock-icon" onClose={mockOnClose} />);

    expect(container).toBeEmptyDOMElement();
    await waitFor(() => expect(mockForceUpdate).toHaveBeenCalled());
    expect(container).not.toBeEmptyDOMElement();
    expect(container).toMatchSnapshot();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should render null when icon not found', async () => {
    jest.doMock('@core/app/icons/shape/basic/mock-null.svg', () => {
      throw new Error("Cannot find module './basic/mock-null.svg'");
    });

    const errorLog = jest.spyOn(console, 'error');
    const { container } = render(<ShapeIcon activeTab="basic" fileName="mock-null" onClose={mockOnClose} />);

    await waitFor(() => {
      expect(errorLog).toHaveBeenCalledTimes(1);
      expect(errorLog).toHaveBeenCalledWith(
        "Fail to load icon from '@core/app/icons/shape/basic/mock-null.svg': Error: Cannot find module './basic/mock-null.svg'",
      );
    });
    expect(container).toBeEmptyDOMElement();
    expect(mockOnClose).not.toHaveBeenCalled();
    jest.dontMock('@core/app/icons/shape/basic/mock-null.svg');
  });

  it('should import predefined object', async () => {
    const { container } = render(<ShapeIcon activeTab="basic" fileName="mock-circle" onClose={mockOnClose} />);

    await waitFor(() => expect(mockForceUpdate).toHaveBeenCalled());
    fireEvent.click(container.querySelector('.icon'));
    await waitFor(() => expect(mockOnClose).toHaveBeenCalledTimes(1));
    expect(mockAddSvgElementFromJson).toHaveBeenCalledTimes(1);
    expect(mockGetCurrentLayerName).not.toHaveBeenCalled();
    expect(mockGetLayerByName).not.toHaveBeenCalled();
    expect(mockGetData).not.toHaveBeenCalled();
    expect(mockImportSvgString).not.toHaveBeenCalled();
    expect(mockGetSvgRealLocation).not.toHaveBeenCalled();
    expect(mockSelectOnly).toHaveBeenCalledTimes(1);
    expect(mockSelectOnly).toHaveBeenCalledWith([mockElement]);
    expect(mockSetSvgElemPosition).not.toHaveBeenCalled();
    expect(mockSetSvgElemSize).not.toHaveBeenCalled();
    expect(mockDisassembleUse).not.toHaveBeenCalled();
    expect(mockUpdateElementColor).toHaveBeenCalledTimes(1);
    expect(mockUpdateElementColor).toHaveBeenCalledWith(mockElement);
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
  });

  it('should import svg object, update location and disassemble', async () => {
    const { container } = render(<ShapeIcon activeTab="basic" fileName="mock-icon" onClose={mockOnClose} />);

    fireEvent.click(container.querySelector('.icon'));
    await waitFor(() => expect(mockOnClose).toHaveBeenCalledTimes(1));
    expect(mockAddSvgElementFromJson).not.toHaveBeenCalled();
    expect(mockGetCurrentLayerName).toHaveBeenCalledTimes(1);
    expect(mockGetLayerByName).toHaveBeenCalledTimes(1);
    expect(mockGetData).toHaveBeenCalledTimes(1);
    expect(mockGetData).toHaveBeenCalledWith('mock-layer-elem', 'module');
    expect(mockImportSvgString).toHaveBeenCalledTimes(1);
    expect(mockGetSvgRealLocation).toHaveBeenCalledTimes(1);
    expect(mockGetSvgRealLocation).toHaveBeenCalledWith(mockElement);
    expect(mockSelectOnly).toHaveBeenCalledTimes(1);
    expect(mockSelectOnly).toHaveBeenCalledWith([mockElement]);
    expect(mockSetSvgElemPosition).toHaveBeenCalledTimes(2);
    expect(mockSetSvgElemPosition).toHaveBeenNthCalledWith(1, 'x', 0, mockElement, false);
    expect(mockSetSvgElemPosition).toHaveBeenNthCalledWith(2, 'y', 0, mockElement, false);
    expect(mockSetSvgElemSize).toHaveBeenCalledTimes(2);
    expect(mockSetSvgElemSize).toHaveBeenNthCalledWith(1, 'width', 300);
    expect(mockSetSvgElemSize).toHaveBeenNthCalledWith(2, 'height', 500);
    expect(mockDisassembleUse).toHaveBeenCalledTimes(1);
    expect(mockDisassembleUse).toHaveBeenNthCalledWith(1, [mockElement], {
      parentCmd: expect.anything(),
      skipConfirm: true,
    });
    expect(mockUpdateElementColor).toHaveBeenCalledTimes(1);
    expect(mockUpdateElementColor).toHaveBeenCalledWith('mock-path-elem');
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
  });
});
