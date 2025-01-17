/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/first */
import React, { useCallback, useState } from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';

import ShapeIcon from './ShapeIcon';

const mockElement = document.createElement('use');
const mockAddSvgElementFromJson = jest.fn().mockReturnValue(mockElement);
const mockGetSvgRealLocation = jest.fn().mockReturnValue({ x: 15, y: 10, width: 15, height: 25 });
const mockSelectOnly = jest.fn();
const mockSetSvgElemPosition = jest.fn();
const mockSetSvgElemSize = jest.fn();
const mockDisassembleUse2Group = jest.fn();
const mockAddCommandToHistory = jest.fn();
const mockGetCurrentLayerName = jest.fn();
const mockGetSelectedElems = jest.fn().mockReturnValue(['mock-path-elem']);
jest.mock('helpers/svg-editor-helper', () => ({
  getSVGAsync: (callback) =>
    callback({
      Canvas: {
        addSvgElementFromJson: (...args: any) => mockAddSvgElementFromJson(...args),
        getNextId: jest.fn(),
        getSvgRealLocation: (...args: any) => mockGetSvgRealLocation(...args),
        isUsingLayerColor: true,
        selectOnly: (...args: any) => mockSelectOnly(...args),
        setSvgElemPosition: (...args: any) => mockSetSvgElemPosition(...args),
        setSvgElemSize: (...args: any) => mockSetSvgElemSize(...args),
        disassembleUse2Group: (...args: any) => mockDisassembleUse2Group(...args),
        addCommandToHistory: (...args: any) => mockAddCommandToHistory(...args),
        getCurrentDrawing: () => ({ getCurrentLayerName: mockGetCurrentLayerName }),
        getSelectedElems: () => mockGetSelectedElems(),
      },
    }),
}));

const mockUpdateElementColor = jest.fn();
jest.mock(
  'helpers/color/updateElementColor',
  () =>
    (...args: any) =>
      mockUpdateElementColor(...args)
);

const mockImportSvgString = jest.fn().mockResolvedValue(mockElement);
jest.mock(
  'app/svgedit/operations/import/importSvgString',
  () =>
    (...args: any) =>
      mockImportSvgString(...args)
);

const mockGetData = jest.fn();
jest.mock('helpers/layer/layer-config-helper', () => ({
  getData: (...args: any) => mockGetData(...args),
}));

const mockGetLayerByName = jest.fn().mockReturnValue('mock-layer-elem');
jest.mock('helpers/layer/layer-helper', () => ({
  getLayerByName: (...args: any) => mockGetLayerByName(...args),
}));

jest.mock('app/constants/shape-panel-constants', () => ({
  __esModule: true,
  builtInElements: {
    'mock-circle': {
      element: 'ellipse',
      attr: { cx: 250, cy: 250, rx: 250, ry: 250, 'data-ratiofixed': true },
    },
  },
  ShapeTabs: ['basic'],
  default: {
    basic: {
      shape: {
        fileNames: ['mock-circle', 'mock-svg', 'mock-null'],
      },
    },
  },
}));

jest.mock('helpers/i18n', () => ({
  lang: {
    beambox: {
      shapes_panel: {
        title: 'Elements',
        shape: 'Shape',
        graphics: 'Graphics',
      },
    },
  },
}));

const mockUseIsMobile = jest.fn();
jest.mock('helpers/system-helper', () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

const mockForceUpdate = jest.fn();
jest.mock('helpers/use-force-update', () => (): (() => void) => {
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
    const { container } = render(
      <ShapeIcon activeTab="basic" fileName="mock-icon" onClose={mockOnClose} />
    );
    expect(container).toBeEmptyDOMElement();
    await waitFor(() => expect(mockForceUpdate).toBeCalled());
    expect(container).not.toBeEmptyDOMElement();
    expect(container).toMatchSnapshot();
    expect(mockOnClose).not.toBeCalled();
  });

  it('should render null when icon not found', async () => {
    jest.doMock('app/icons/shape/basic/mock-null.svg', () => {
      throw new Error("Cannot find module './basic/mock-null.svg'");
    });
    const errorLog = jest.spyOn(console, 'error');
    const { container } = render(
      <ShapeIcon activeTab="basic" fileName="mock-null" onClose={mockOnClose} />
    );
    await waitFor(() => {
      expect(errorLog).toBeCalledTimes(1);
      expect(errorLog).toBeCalledWith(
        // eslint-disable-next-line max-len
        "Fail to load icon from 'app/icons/shape/basic/mock-null.svg': Error: Cannot find module './basic/mock-null.svg'"
      );
    });
    expect(container).toBeEmptyDOMElement();
    expect(mockOnClose).not.toBeCalled();
    jest.dontMock('app/icons/shape/basic/mock-null.svg');
  });

  it('should import predefined object', async () => {
    const { container } = render(
      <ShapeIcon activeTab="basic" fileName="mock-circle" onClose={mockOnClose} />
    );
    await waitFor(() => expect(mockForceUpdate).toBeCalled());
    fireEvent.click(container.querySelector('.icon'));
    await waitFor(() => expect(mockOnClose).toBeCalledTimes(1));
    expect(mockAddSvgElementFromJson).toBeCalledTimes(1);
    expect(mockGetCurrentLayerName).not.toBeCalled();
    expect(mockGetLayerByName).not.toBeCalled();
    expect(mockGetData).not.toBeCalled();
    expect(mockImportSvgString).not.toBeCalled();
    expect(mockGetSvgRealLocation).not.toBeCalled();
    expect(mockSelectOnly).toBeCalledTimes(1);
    expect(mockSelectOnly).toBeCalledWith([mockElement]);
    expect(mockSetSvgElemPosition).not.toBeCalled();
    expect(mockSetSvgElemSize).not.toBeCalled();
    expect(mockDisassembleUse2Group).not.toBeCalled();
    expect(mockUpdateElementColor).toBeCalledTimes(1);
    expect(mockUpdateElementColor).toBeCalledWith(mockElement);
    expect(mockAddCommandToHistory).toBeCalledTimes(1);
  });

  it('should import svg object, update location and disassemble', async () => {
    const { container } = render(
      <ShapeIcon activeTab="basic" fileName="mock-icon" onClose={mockOnClose} />
    );
    fireEvent.click(container.querySelector('.icon'));
    await waitFor(() => expect(mockOnClose).toBeCalledTimes(1));
    expect(mockAddSvgElementFromJson).not.toBeCalled();
    expect(mockGetCurrentLayerName).toBeCalledTimes(1);
    expect(mockGetLayerByName).toBeCalledTimes(1);
    expect(mockGetData).toBeCalledTimes(1);
    expect(mockGetData).toBeCalledWith('mock-layer-elem', 'module');
    expect(mockImportSvgString).toBeCalledTimes(1);
    expect(mockGetSvgRealLocation).toBeCalledTimes(1);
    expect(mockGetSvgRealLocation).toBeCalledWith(mockElement);
    expect(mockSelectOnly).toBeCalledTimes(1);
    expect(mockSelectOnly).toBeCalledWith([mockElement]);
    expect(mockSetSvgElemPosition).toBeCalledTimes(2);
    expect(mockSetSvgElemPosition).toHaveBeenNthCalledWith(1, 'x', 0, mockElement, false);
    expect(mockSetSvgElemPosition).toHaveBeenNthCalledWith(2, 'y', 0, mockElement, false);
    expect(mockSetSvgElemSize).toBeCalledTimes(2);
    expect(mockSetSvgElemSize).toHaveBeenNthCalledWith(1, 'width', 300);
    expect(mockSetSvgElemSize).toHaveBeenNthCalledWith(2, 'height', 500);
    expect(mockDisassembleUse2Group).toBeCalledTimes(1);
    expect(mockDisassembleUse2Group).toHaveBeenNthCalledWith(1, [mockElement], true, false);
    expect(mockUpdateElementColor).toBeCalledTimes(1);
    expect(mockUpdateElementColor).toBeCalledWith('mock-path-elem');
    expect(mockAddCommandToHistory).toBeCalledTimes(1);
  });
});
