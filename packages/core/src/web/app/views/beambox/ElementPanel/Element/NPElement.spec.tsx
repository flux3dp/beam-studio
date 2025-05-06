import React from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react';

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
const mockImportSvg = jest.fn().mockResolvedValue([mockElement]);

jest.mock('@core/app/svgedit/operations/import/importSvg', () => mockImportSvg);

const mockPostImportElement = jest.fn();

jest.mock('@core/app/svgedit/operations/import/postImportElement', () => mockPostImportElement);

const mockGetNPIconByID = jest.fn().mockResolvedValue('data:image/svg+xml;base64,1234');

jest.mock('@core/helpers/api/flux-id', () => ({
  getNPIconByID: mockGetNPIconByID,
}));

const mockGetData = jest.fn().mockReturnValue(5);

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  getData: mockGetData,
}));

const mockGetLayerByName = jest.fn().mockReturnValue('mock-layer-elem');

jest.mock('@core/helpers/layer/layer-helper', () => ({
  getLayerByName: mockGetLayerByName,
}));

const mockGetCurrentLayerName = jest.fn().mockReturnValue('mock-layer-name');

jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync: (callback) =>
    callback({
      Canvas: {
        getCurrentDrawing: () => ({ getCurrentLayerName: mockGetCurrentLayerName }),
      },
    }),
}));

jest.mock('@core/helpers/web-need-connection-helper', () => (callback) => callback());

const mockFetch = jest.fn().mockResolvedValue({ blob: () => Promise.resolve(new Blob()) });

global.fetch = mockFetch;

import NPElement from './NPElement';

describe('test NPElement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', async () => {
    const { container } = render(<NPElement icon={{ id: '1234', thumbnail_url: 'img_thumbnail_url' }} />);

    expect(container).toMatchSnapshot();

    const icon = container.querySelector('.icon');
    const img = container.querySelector('img');

    fireEvent.click(icon);
    expect(mockAddToHistory).not.toHaveBeenCalled();

    fireEvent.load(img);
    expect(container).toMatchSnapshot();

    fireEvent.click(icon);
    waitFor(() => {
      expect(mockAddToHistory).toHaveBeenCalled();
      expect(mockAddToHistory).toHaveBeenCalledWith({
        npIcon: { id: '1234', thumbnail_url: 'img_thumbnail_url' },
        type: 'np',
      });
      expect(mockGetNPIconByID).toHaveBeenCalledWith('1234');
      expect(mockFetch).toHaveBeenCalledWith('data:image/svg+xml;base64,1234');
      expect(mockCreateBatchCommand).toHaveBeenCalledWith('Import NP SVG');
      expect(mockGetCurrentLayerName).toHaveBeenCalled();
      expect(mockGetLayerByName).toHaveBeenCalled();
      expect(mockGetData).toHaveBeenCalled();
      expect(mockImportSvg).toHaveBeenCalledWith(expect.any(Blob), {
        batchCmd: mockBatchCommand,
        importType: 'layer',
        isFromNounProject: true,
        targetModule: 5,
      });
      expect(mockPostImportElement).toHaveBeenCalledWith(mockElement, mockBatchCommand);
      expect(mockAddCommandToHistory).toHaveBeenCalledWith(mockBatchCommand);
      expect(mockCloseDrawer).toHaveBeenCalled();
    });
  });

  it('should render null when set hidden', async () => {
    const { container } = render(<NPElement icon={{ hidden: true, id: '1234', thumbnail_url: 'img_thumbnail_url' }} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('should render null when img error', async () => {
    const { container } = render(<NPElement icon={{ id: '1234', thumbnail_url: 'img_thumbnail_url' }} />);
    const img = container.querySelector('img');

    fireEvent.error(img);
    expect(container).toBeEmptyDOMElement();
  });
});
