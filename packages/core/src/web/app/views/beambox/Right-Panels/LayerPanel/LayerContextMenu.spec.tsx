/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';

import LayerModule from 'app/constants/layer-module/layer-modules';
import { LayerPanelContext } from 'app/views/beambox/Right-Panels/contexts/LayerPanelContext';

import LayerContextMenu from './LayerContextMenu';

const mockClearSelection = jest.fn();
const mockAddCommandToHistory = jest.fn();
jest.mock('helpers/svg-editor-helper', () => ({
  getSVGAsync: (cb) =>
    cb({
      Canvas: {
        clearSelection: () => mockClearSelection(),
        undoMgr: {
          addCommandToHistory: (...args) => mockAddCommandToHistory(...args),
        },
      },
    }),
}));

const mockCloneLayers = jest.fn();
const mockDeleteLayers = jest.fn();
const mockGetAllLayerNames = jest.fn();
const mockGetLayerElementByName = jest.fn();
const mockGetLayerPosition = jest.fn();
const mockMergeLayers = jest.fn();
const mockSetLayersLock = jest.fn();
jest.mock('helpers/layer/layer-helper', () => ({
  cloneLayers: (...args) => mockCloneLayers(...args),
  deleteLayers: (...args) => mockDeleteLayers(...args),
  getLayerElementByName: (...args) => mockGetLayerElementByName(...args),
  getAllLayerNames: () => mockGetAllLayerNames(),
  getLayerPosition: (...args) => mockGetLayerPosition(...args),
  mergeLayers: (...args) => mockMergeLayers(...args),
  setLayersLock: (...args) => mockSetLayersLock(...args),
}));

jest.mock('helpers/useI18n', () => () => ({
  beambox: {
    right_panel: {
      layer_panel: {
        layers: {
          rename: 'rename',
          dupe: 'dupe',
          lock: 'lock',
          unlock: 'unlock',
          del: 'del',
          merge_down: 'merge_down',
          merge_all: 'merge_all',
          merge_selected: 'merge_selected',
          splitFullColor: 'splitFullColor',
          switchToSingleColor: 'switchToSingleColor',
          switchToFullColor: 'switchToFullColor',
        },
        notification: {
          splitColorTitle: 'splitColorTitle',
          splitColorMsg: 'splitColorMsg',
        },
      },
    },
  },
}));

const mockGetData = jest.fn();
jest.mock('helpers/layer/layer-config-helper', () => ({
  getData: (...args) => mockGetData(...args),
}));

const mockSplitFullColorLayer = jest.fn();
jest.mock(
  'helpers/layer/full-color/splitFullColorLayer',
  () =>
    (...args) =>
      mockSplitFullColorLayer(...args)
);

const mockToggleFullColorLayer = jest.fn();
jest.mock(
  'helpers/layer/full-color/toggleFullColorLayer',
  () =>
    (...args) =>
      mockToggleFullColorLayer(...args)
);

jest.mock('app/views/beambox/Right-Panels/contexts/LayerPanelContext', () => ({
  LayerPanelContext: React.createContext(null),
}));

const useIsMobile = jest.fn();
jest.mock('helpers/system-helper', () => ({
  useIsMobile: () => useIsMobile(),
}));

const mockUseWorkarea = jest.fn();
jest.mock('helpers/hooks/useWorkarea', () => () => mockUseWorkarea());

const mockPopUp = jest.fn();
jest.mock('app/actions/alert-caller', () => ({
  popUp: (...args) => mockPopUp(...args),
}));

const mockTogglePresprayArea = jest.fn();
jest.mock('app/actions/canvas/prespray-area', () => ({
  togglePresprayArea: () => mockTogglePresprayArea(),
}));

const mockUpdateLayerColor = jest.fn();
jest.mock(
  'helpers/color/updateLayerColor',
  () =>
    (...args) =>
      mockUpdateLayerColor(...args)
);

const mockDrawing = {
  getLayerName: jest.fn(),
  getCurrentLayerName: jest.fn(),
} as any;

const mockElem = {
  getAttribute: jest.fn(),
};

const mockSetSelectedLayers = jest.fn();
const mockSelectOnlyLayer = jest.fn();
const mockForceUpdate = jest.fn();
const mockRenameLayer = jest.fn();
const mockForceUpdateSelectedLayers = jest.fn();
describe('test LayerContextMenu', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockUseWorkarea.mockReturnValue('ado1');
    mockMergeLayers.mockResolvedValue('mockLayer');
  });

  it('should render correctly when multiselecting', () => {
    mockDrawing.getLayerName.mockReturnValue('layer1');
    const { container } = render(
      <LayerPanelContext.Provider
        value={
          {
            selectedLayers: ['layer1', 'layer2'],
            setSelectedLayers: mockSetSelectedLayers,
            forceUpdate: mockForceUpdate,
            forceUpdateSelectedLayers: mockForceUpdateSelectedLayers,
            hasVector: false,
          } as any
        }
      >
        <LayerContextMenu
          drawing={mockDrawing}
          selectOnlyLayer={mockSelectOnlyLayer}
          renameLayer={mockRenameLayer}
        />
      </LayerPanelContext.Provider>
    );
    expect(container).toMatchSnapshot();
    expect(mockUseWorkarea).toBeCalledTimes(1);
  });

  it('should render correctly when selecting last', () => {
    mockDrawing.getLayerName.mockReturnValue('layer1');
    const { container } = render(
      <LayerPanelContext.Provider
        value={
          {
            selectedLayers: ['layer1'],
            setSelectedLayers: mockSetSelectedLayers,
            forceUpdate: mockForceUpdate,
            forceUpdateSelectedLayers: mockForceUpdateSelectedLayers,
            hasVector: false,
          } as any
        }
      >
        <LayerContextMenu
          drawing={mockDrawing}
          selectOnlyLayer={mockSelectOnlyLayer}
          renameLayer={mockRenameLayer}
        />
      </LayerPanelContext.Provider>
    );
    expect(container).toMatchSnapshot();
  });

  it('should render correctly in mobile', () => {
    useIsMobile.mockReturnValue(true);
    mockDrawing.getLayerName.mockReturnValue('layer1');
    const { container } = render(
      <LayerPanelContext.Provider
        value={
          {
            selectedLayers: ['layer2'],
            setSelectedLayers: mockSetSelectedLayers,
            forceUpdate: mockForceUpdate,
            forceUpdateSelectedLayers: mockForceUpdateSelectedLayers,
            hasVector: false,
          } as any
        }
      >
        <LayerContextMenu
          drawing={mockDrawing}
          selectOnlyLayer={mockSelectOnlyLayer}
          renameLayer={mockRenameLayer}
        />
      </LayerPanelContext.Provider>
    );
    expect(container).toMatchSnapshot();
  });

  test('rename layer should work', () => {
    const { getByText } = render(
      <LayerPanelContext.Provider
        value={
          {
            selectedLayers: ['layer2'],
            setSelectedLayers: mockSetSelectedLayers,
            forceUpdate: mockForceUpdate,
            forceUpdateSelectedLayers: mockForceUpdateSelectedLayers,
            hasVector: false,
          } as any
        }
      >
        <LayerContextMenu
          drawing={mockDrawing}
          selectOnlyLayer={mockSelectOnlyLayer}
          renameLayer={mockRenameLayer}
        />
      </LayerPanelContext.Provider>
    );
    expect(mockSelectOnlyLayer).not.toBeCalled();
    expect(mockRenameLayer).not.toBeCalled();
    fireEvent.click(getByText('rename'));
    expect(mockSelectOnlyLayer).toBeCalledTimes(1);
    expect(mockSelectOnlyLayer).toHaveBeenLastCalledWith('layer2');
    expect(mockRenameLayer).toBeCalledTimes(1);
  });

  test('cloneLayers should work', () => {
    const { getByText } = render(
      <LayerPanelContext.Provider
        value={
          {
            selectedLayers: ['layer1', 'layer2'],
            setSelectedLayers: mockSetSelectedLayers,
            forceUpdate: mockForceUpdate,
            forceUpdateSelectedLayers: mockForceUpdateSelectedLayers,
            hasVector: false,
          } as any
        }
      >
        <LayerContextMenu
          drawing={mockDrawing}
          selectOnlyLayer={mockSelectOnlyLayer}
          renameLayer={mockRenameLayer}
        />
      </LayerPanelContext.Provider>
    );
    expect(mockCloneLayers).not.toBeCalled();
    mockCloneLayers.mockReturnValue(['layer1 copy', 'layer2 copy']);
    expect(mockSetSelectedLayers).not.toBeCalled();
    fireEvent.click(getByText('dupe'));
    expect(mockCloneLayers).toBeCalledWith(['layer1', 'layer2']);
    expect(mockSetSelectedLayers).toBeCalledWith(['layer1 copy', 'layer2 copy']);
  });

  test('lock layers should work', () => {
    const { getByText } = render(
      <LayerPanelContext.Provider
        value={
          {
            selectedLayers: ['layer1', 'layer2'],
            setSelectedLayers: mockSetSelectedLayers,
            forceUpdate: mockForceUpdate,
            forceUpdateSelectedLayers: mockForceUpdateSelectedLayers,
            hasVector: false,
          } as any
        }
      >
        <LayerContextMenu
          drawing={mockDrawing}
          selectOnlyLayer={mockSelectOnlyLayer}
          renameLayer={mockRenameLayer}
        />
      </LayerPanelContext.Provider>
    );
    expect(mockClearSelection).not.toBeCalled();
    expect(mockSetLayersLock).not.toBeCalled();
    expect(mockSetSelectedLayers).not.toBeCalled();
    fireEvent.click(getByText('lock'));
    expect(mockClearSelection).toBeCalledTimes(1);
    expect(mockSetLayersLock).toBeCalledTimes(1);
    expect(mockSetLayersLock).toBeCalledWith(['layer1', 'layer2'], true);
    expect(mockForceUpdate).toBeCalledTimes(1);
  });

  test('unlock layers should work', () => {
    useIsMobile.mockReturnValue(true);
    mockGetLayerElementByName.mockReturnValue(mockElem);
    mockElem.getAttribute.mockReturnValue('true');

    const { container, getByText } = render(
      <LayerPanelContext.Provider
        value={
          {
            selectedLayers: ['layer1'],
            setSelectedLayers: mockSetSelectedLayers,
            forceUpdate: mockForceUpdate,
            forceUpdateSelectedLayers: mockForceUpdateSelectedLayers,
            hasVector: false,
          } as any
        }
      >
        <LayerContextMenu
          drawing={mockDrawing}
          selectOnlyLayer={mockSelectOnlyLayer}
          renameLayer={mockRenameLayer}
        />
      </LayerPanelContext.Provider>
    );
    expect(container).toMatchSnapshot();
    expect(mockClearSelection).not.toBeCalled();
    expect(mockSetLayersLock).not.toBeCalled();
    expect(mockSetSelectedLayers).not.toBeCalled();
    fireEvent.click(getByText('unlock'));
    expect(mockClearSelection).toBeCalledTimes(1);
    expect(mockSetLayersLock).toBeCalledTimes(1);
    expect(mockSetLayersLock).toBeCalledWith(['layer1'], false);
    expect(mockForceUpdate).toBeCalledTimes(1);
  });

  test('deleteLayers should work', () => {
    const { getByText } = render(
      <LayerPanelContext.Provider
        value={
          {
            selectedLayers: ['layer1', 'layer2'],
            setSelectedLayers: mockSetSelectedLayers,
            forceUpdate: mockForceUpdate,
            forceUpdateSelectedLayers: mockForceUpdateSelectedLayers,
            hasVector: false,
          } as any
        }
      >
        <LayerContextMenu
          drawing={mockDrawing}
          selectOnlyLayer={mockSelectOnlyLayer}
          renameLayer={mockRenameLayer}
        />
      </LayerPanelContext.Provider>
    );
    expect(mockDeleteLayers).not.toBeCalled();
    expect(mockSetSelectedLayers).not.toBeCalled();
    expect(mockTogglePresprayArea).not.toBeCalled();
    fireEvent.click(getByText('del'));
    expect(mockDeleteLayers).toBeCalledWith(['layer1', 'layer2']);
    expect(mockSetSelectedLayers).toBeCalledWith([]);
    expect(mockTogglePresprayArea).toBeCalledTimes(1);
  });

  test('merge down should work', async () => {
    const { getByText } = render(
      <LayerPanelContext.Provider
        value={
          {
            selectedLayers: ['layer1'],
            setSelectedLayers: mockSetSelectedLayers,
            forceUpdate: mockForceUpdate,
            forceUpdateSelectedLayers: mockForceUpdateSelectedLayers,
            hasVector: false,
          } as any
        }
      >
        <LayerContextMenu
          drawing={mockDrawing}
          selectOnlyLayer={mockSelectOnlyLayer}
          renameLayer={mockRenameLayer}
        />
      </LayerPanelContext.Provider>
    );
    mockGetLayerPosition.mockReturnValue(1);
    mockDrawing.getLayerName.mockReturnValue('layer2');
    expect(mockMergeLayers).not.toBeCalled();
    expect(mockSetSelectedLayers).not.toBeCalled();
    fireEvent.click(getByText('merge_down'));
    expect(mockGetLayerPosition).toBeCalledTimes(1);
    expect(mockGetLayerPosition).toBeCalledWith('layer1');
    expect(mockDrawing.getLayerName).toBeCalledTimes(2);
    expect(mockDrawing.getLayerName).toHaveBeenLastCalledWith(0);
    expect(mockMergeLayers).toBeCalledWith(['layer1'], 'layer2');
    await waitFor(() => {
      expect(mockSelectOnlyLayer).toBeCalledTimes(1);
      expect(mockSelectOnlyLayer).toHaveBeenLastCalledWith('layer2');
    });
  });

  test('merge all should work', async () => {
    mockGetAllLayerNames.mockReturnValue(['layer1', 'layer2', 'layer3']);
    const { getByText } = render(
      <LayerPanelContext.Provider
        value={
          {
            selectedLayers: ['layer2'],
            setSelectedLayers: mockSetSelectedLayers,
            forceUpdate: mockForceUpdate,
            forceUpdateSelectedLayers: mockForceUpdateSelectedLayers,
            hasVector: false,
          } as any
        }
      >
        <LayerContextMenu
          drawing={mockDrawing}
          selectOnlyLayer={mockSelectOnlyLayer}
          renameLayer={mockRenameLayer}
        />
      </LayerPanelContext.Provider>
    );
    expect(mockMergeLayers).not.toBeCalled();
    mockMergeLayers.mockReturnValue('layer1');
    expect(mockSetSelectedLayers).not.toBeCalled();
    mockGetLayerElementByName.mockReturnValue(mockElem);
    mockElem.getAttribute.mockReturnValue('1');
    fireEvent.click(getByText('merge_all'));
    expect(mockGetAllLayerNames).toBeCalledTimes(1);
    expect(mockMergeLayers).toBeCalledTimes(1);
    expect(mockMergeLayers).toHaveBeenLastCalledWith(['layer1', 'layer2', 'layer3']);
    await waitFor(() => {
      expect(mockSelectOnlyLayer).toBeCalledTimes(1);
      expect(mockSelectOnlyLayer).toHaveBeenLastCalledWith('layer1');
      expect(mockUpdateLayerColor).toBeCalledTimes(1);
      expect(mockUpdateLayerColor).toHaveBeenLastCalledWith(mockElem);
    });
  });

  test('merge selected should work', async () => {
    const { getByText } = render(
      <LayerPanelContext.Provider
        value={
          {
            selectedLayers: ['layer1', 'layer2'],
            setSelectedLayers: mockSetSelectedLayers,
            forceUpdate: mockForceUpdate,
            forceUpdateSelectedLayers: mockForceUpdateSelectedLayers,
            hasVector: false,
          } as any
        }
      >
        <LayerContextMenu
          drawing={mockDrawing}
          selectOnlyLayer={mockSelectOnlyLayer}
          renameLayer={mockRenameLayer}
        />
      </LayerPanelContext.Provider>
    );
    mockDrawing.getCurrentLayerName.mockReturnValue('layer2');
    mockMergeLayers.mockReturnValue('layer2');
    expect(mockDrawing.getCurrentLayerName).not.toBeCalled();
    expect(mockMergeLayers).not.toBeCalled();
    expect(mockSetSelectedLayers).not.toBeCalled();
    mockGetLayerElementByName.mockReturnValue(mockElem);
    mockElem.getAttribute.mockReturnValue('0');
    fireEvent.click(getByText('merge_selected'));
    expect(mockDrawing.getCurrentLayerName).toBeCalledTimes(1);
    expect(mockMergeLayers).toBeCalledTimes(1);
    expect(mockMergeLayers).toHaveBeenLastCalledWith(['layer1', 'layer2'], 'layer2');
    await waitFor(() => {
      expect(mockSetSelectedLayers).toBeCalledTimes(1);
      expect(mockSetSelectedLayers).toHaveBeenLastCalledWith(['layer2']);
      expect(mockGetLayerElementByName).toBeCalledTimes(2);
      expect(mockGetLayerElementByName).toHaveBeenLastCalledWith('layer2');
      expect(mockUpdateLayerColor).toBeCalledTimes(1);
      expect(mockUpdateLayerColor).toHaveBeenLastCalledWith(mockElem);
    });
  });

  it('should render correctly when selecting printing layer', async () => {
    mockDrawing.getLayerName.mockReturnValue('layer1');
    mockGetLayerElementByName.mockReturnValue(mockElem);
    mockGetData.mockReturnValueOnce(LayerModule.PRINTER).mockReturnValueOnce(false);
    const { container } = render(
      <LayerPanelContext.Provider
        value={
          {
            selectedLayers: ['layer1'],
            setSelectedLayers: mockSetSelectedLayers,
            forceUpdate: mockForceUpdate,
            forceUpdateSelectedLayers: mockForceUpdateSelectedLayers,
            hasVector: false,
          } as any
        }
      >
        <LayerContextMenu
          drawing={mockDrawing}
          selectOnlyLayer={mockSelectOnlyLayer}
          renameLayer={mockRenameLayer}
        />
      </LayerPanelContext.Provider>
    );
    expect(mockGetLayerElementByName).toBeCalledTimes(1);
    expect(mockGetLayerElementByName).toHaveBeenLastCalledWith('layer1');
    expect(mockGetData).toBeCalledTimes(3);
    expect(mockGetData).toHaveBeenNthCalledWith(1, mockElem, 'module');
    expect(mockGetData).toHaveBeenNthCalledWith(2, mockElem, 'fullcolor');
    expect(mockGetData).toHaveBeenNthCalledWith(3, mockElem, 'split');
    expect(container).toMatchSnapshot();
  });

  test('click split color should work', async () => {
    mockDrawing.getLayerName.mockReturnValue('layer1');
    mockGetLayerElementByName.mockReturnValue(mockElem);
    mockGetData.mockReturnValueOnce(LayerModule.PRINTER).mockReturnValueOnce(true);
    const { getByText } = render(
      <LayerPanelContext.Provider
        value={
          {
            selectedLayers: ['layer1'],
            setSelectedLayers: mockSetSelectedLayers,
            forceUpdate: mockForceUpdate,
            forceUpdateSelectedLayers: mockForceUpdateSelectedLayers,
            hasVector: false,
          } as any
        }
      >
        <LayerContextMenu
          drawing={mockDrawing}
          selectOnlyLayer={mockSelectOnlyLayer}
          renameLayer={mockRenameLayer}
        />
      </LayerPanelContext.Provider>
    );
    expect(mockSplitFullColorLayer).not.toBeCalled();
    await act(async () => {
      fireEvent.click(getByText('splitFullColor'));
    });
    expect(mockPopUp).toBeCalledTimes(1);
    mockPopUp.mock.calls[0][0].onConfirm();
    await waitFor(() => {
      expect(mockSplitFullColorLayer).toBeCalledTimes(1);
      expect(mockSplitFullColorLayer).toHaveBeenLastCalledWith('layer1');
      expect(mockSetSelectedLayers).toBeCalledTimes(1);
      expect(mockSetSelectedLayers).toHaveBeenLastCalledWith([]);
    });
  });

  test('click toggle full color should work', async () => {
    mockDrawing.getLayerName.mockReturnValue('layer1');
    mockGetLayerElementByName.mockReturnValue(mockElem);
    mockGetData.mockReturnValueOnce(LayerModule.PRINTER).mockReturnValueOnce(false);
    mockElem.getAttribute.mockReturnValueOnce('false');

    const { getByText } = render(
      <LayerPanelContext.Provider
        value={
          {
            selectedLayers: ['layer1'],
            setSelectedLayers: mockSetSelectedLayers,
            forceUpdate: mockForceUpdate,
            forceUpdateSelectedLayers: mockForceUpdateSelectedLayers,
            hasVector: false,
          } as any
        }
      >
        <LayerContextMenu
          drawing={mockDrawing}
          selectOnlyLayer={mockSelectOnlyLayer}
          renameLayer={mockRenameLayer}
        />
      </LayerPanelContext.Provider>
    );
    expect(mockSplitFullColorLayer).not.toBeCalled();
    const mockCmd = {
      isEmpty: jest.fn(),
    };
    mockToggleFullColorLayer.mockReturnValue(mockCmd);
    mockCmd.isEmpty.mockReturnValue(false);
    await act(async () => {
      fireEvent.click(getByText('switchToFullColor'));
    });
    expect(mockElem.getAttribute).toBeCalledTimes(1);
    expect(mockElem.getAttribute).toHaveBeenNthCalledWith(1, 'data-lock');
    expect(mockToggleFullColorLayer).toBeCalledTimes(1);
    expect(mockToggleFullColorLayer).toHaveBeenLastCalledWith(mockElem);
    expect(mockSetSelectedLayers).toBeCalledTimes(1);
    expect(mockSetSelectedLayers).toHaveBeenLastCalledWith([]);
    expect(mockAddCommandToHistory).toBeCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenLastCalledWith(mockCmd);
    expect(mockCmd.isEmpty).toBeCalledTimes(1);
  });
});
