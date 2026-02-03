import React, { useCallback, useState } from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react';

jest.mock('@core/app/constants/element-panel-constants', () => ({
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
  MainTypes: ['basic'],
}));

const mockCloseDrawer = jest.fn();
const mockAddToHistory = jest.fn();

jest.mock('@core/app/contexts/ElementPanelContext', () => ({
  ElementPanelContext: React.createContext({ addToHistory: mockAddToHistory, closeDrawer: mockCloseDrawer }),
}));

const mockBatchCommand = { addSubCommand: jest.fn() };
const mockCreateBatchCommand = jest.fn().mockImplementation(() => mockBatchCommand);

jest.mock('@core/app/svgedit/history/HistoryCommandFactory', () => ({
  createBatchCommand: mockCreateBatchCommand,
}));

const mockAddCommandToHistory = jest.fn();

jest.mock('@core/app/svgedit/history/undoManager', () => ({
  addCommandToHistory: mockAddCommandToHistory,
}));

const mockElement = document.createElement('use');
const mockImportSvgString = jest.fn().mockResolvedValue([mockElement]);

jest.mock('@core/app/svgedit/operations/import/importSvgString', () => mockImportSvgString);

const mockPostImportElement = jest.fn();

jest.mock('@core/app/svgedit/operations/import/postImportElement', () => mockPostImportElement);

const mockUpdateElementColor = jest.fn();

jest.mock('@core/helpers/color/updateElementColor', () => mockUpdateElementColor);

const mockGetData = jest.fn();

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  getData: mockGetData,
}));

const mockGetLayerByName = jest.fn().mockReturnValue('mock-layer-elem');

jest.mock('@core/helpers/layer/layer-helper', () => ({
  getLayerByName: mockGetLayerByName,
}));

const mockGetCurrentLayerName = jest.fn();

jest.mock('@core/app/svgedit/layer/layerManager', () => ({
  getCurrentLayerName: (...args) => mockGetCurrentLayerName(...args),
}));

const mockAddSvgElementFromJson = jest.fn().mockReturnValue(mockElement);
const mockSelectOnly = jest.fn();

jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync: (callback) =>
    callback({
      Canvas: {
        addSvgElementFromJson: mockAddSvgElementFromJson,
        getNextId: jest.fn(),
        selectOnly: mockSelectOnly,
      },
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

import BuiltinElement from './BuiltinElement';

describe('test BuiltinElement', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockGetCurrentLayerName.mockReturnValue('mock-layer-name');
  });

  it('should render correctly', async () => {
    const { container } = render(<BuiltinElement mainType="basic" path="mock-icon" />);

    expect(container).toBeEmptyDOMElement();
    await waitFor(() => expect(mockForceUpdate).toHaveBeenCalled());
    expect(container).not.toBeEmptyDOMElement();
    expect(container).toMatchSnapshot();
    expect(mockCloseDrawer).not.toHaveBeenCalled();
  });

  it('should render correctly when mainType missing', async () => {
    const { container } = render(<BuiltinElement path="basic/mock-icon2" />);

    expect(container).toBeEmptyDOMElement();
    await waitFor(() => expect(mockForceUpdate).toHaveBeenCalled());
    expect(container).not.toBeEmptyDOMElement();
    expect(container).toMatchSnapshot();
    expect(mockCloseDrawer).not.toHaveBeenCalled();
  });

  it('should render null when icon not found', async () => {
    jest.doMock('@core/app/icons/shape/basic/mock-null.svg', () => {
      throw new Error("Cannot find module './basic/mock-null.svg'");
    });

    const errorLog = jest.spyOn(console, 'error');
    const { container } = render(<BuiltinElement mainType="basic" path="mock-null" />);

    await waitFor(() => {
      expect(errorLog).toHaveBeenCalledTimes(1);
      expect(errorLog).toHaveBeenCalledWith(
        "Fail to load icon from '@core/app/icons/shape/basic/mock-null.svg': Error: Cannot find module './basic/mock-null.svg'",
      );
    });
    expect(container).toBeEmptyDOMElement();
    expect(mockCloseDrawer).not.toHaveBeenCalled();
    jest.dontMock('@core/app/icons/shape/basic/mock-null.svg');
  });

  it('should import predefined object', async () => {
    const { container } = render(<BuiltinElement mainType="basic" path="mock-circle" />);

    await waitFor(() => expect(mockForceUpdate).toHaveBeenCalled());
    fireEvent.click(container.querySelector('.icon'));
    await waitFor(() => expect(mockCloseDrawer).toHaveBeenCalledTimes(1));
    expect(mockAddSvgElementFromJson).toHaveBeenCalledTimes(1);
    expect(mockGetCurrentLayerName).not.toHaveBeenCalled();
    expect(mockGetLayerByName).not.toHaveBeenCalled();
    expect(mockGetData).not.toHaveBeenCalled();
    expect(mockImportSvgString).not.toHaveBeenCalled();
    expect(mockSelectOnly).toHaveBeenCalledTimes(1);
    expect(mockSelectOnly).toHaveBeenCalledWith([mockElement]);
    expect(mockUpdateElementColor).toHaveBeenCalledTimes(1);
    expect(mockUpdateElementColor).toHaveBeenCalledWith(mockElement);
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
  });

  it('should import svg object, update location and disassemble', async () => {
    const { container } = render(<BuiltinElement mainType="basic" path="mock-icon" />);

    fireEvent.click(container.querySelector('.icon'));
    await waitFor(() => expect(mockCloseDrawer).toHaveBeenCalledTimes(1));
    expect(mockAddSvgElementFromJson).not.toHaveBeenCalled();
    expect(mockGetCurrentLayerName).toHaveBeenCalledTimes(1);
    expect(mockGetLayerByName).toHaveBeenCalledTimes(1);
    expect(mockGetData).toHaveBeenCalledTimes(1);
    expect(mockGetData).toHaveBeenCalledWith('mock-layer-elem', 'module');
    expect(mockCreateBatchCommand).toHaveBeenCalledTimes(1);
    expect(mockCreateBatchCommand).toHaveBeenCalledWith('Import Element SVG');
    expect(mockImportSvgString).toHaveBeenCalledTimes(1);
    expect(mockPostImportElement).toHaveBeenCalledTimes(1);
    expect(mockPostImportElement).toHaveBeenCalledWith(mockElement, mockBatchCommand);
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenCalledWith(mockBatchCommand);
  });
});
