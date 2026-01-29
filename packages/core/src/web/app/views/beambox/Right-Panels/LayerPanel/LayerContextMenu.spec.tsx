import React from 'react';

import { act, fireEvent, render, waitFor } from '@testing-library/react';

import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import { mockForceUpdate, mockSetSelectedLayers } from '@mocks/@core/app/stores/layer/layerStore';

import LayerContextMenu from './LayerContextMenu';
import i18n from '@core/helpers/i18n';
import useLayerStore from '@core/app/stores/layer/layerStore';

const mockClearSelection = jest.fn();

jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync: (cb) =>
    cb({
      Canvas: {
        clearSelection: () => mockClearSelection(),
      },
    }),
}));

const mockAddCommandToHistory = jest.fn();

jest.mock('@core/app/svgedit/history/undoManager', () => ({
  addCommandToHistory: (...args) => mockAddCommandToHistory(...args),
}));

const mockCloneLayers = jest.fn();
const mockDeleteLayers = jest.fn();
const mockGetAllLayerNames = jest.fn();
const mockGetLayerElementByName = jest.fn();
const mockGetLayerPosition = jest.fn();
const mockMergeLayers = jest.fn();
const mockSetLayersLock = jest.fn();

jest.mock('@core/helpers/layer/layer-helper', () => ({
  cloneLayers: (...args) => mockCloneLayers(...args),
  getLayerPosition: (...args) => mockGetLayerPosition(...args),
  mergeLayers: (...args) => mockMergeLayers(...args),
  setLayersLock: (...args) => mockSetLayersLock(...args),
}));

jest.mock('@core/helpers/layer/deleteLayer', () => ({
  deleteLayers: (...args) => mockDeleteLayers(...args),
}));

const mockGetData = jest.fn();

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  getData: (...args) => mockGetData(...args),
}));

const mockSplitFullColorLayer = jest.fn();

jest.mock(
  '@core/helpers/layer/full-color/splitFullColorLayer',
  () =>
    (...args) =>
      mockSplitFullColorLayer(...args),
);

const mockToggleFullColorLayer = jest.fn();

jest.mock(
  '@core/helpers/layer/full-color/toggleFullColorLayer',
  () =>
    (...args) =>
      mockToggleFullColorLayer(...args),
);

jest.mock('@core/app/svgedit/layer/layerManager', () => ({
  getAllLayerNames: () => mockGetAllLayerNames(),
  getCurrentLayerName: (...args) => mockGetCurrentLayerName(...args),
  getLayerElementByName: (...args) => mockGetLayerElementByName(...args),
  getLayerName: (...args) => mockGetLayerName(...args),
}));

const useIsMobile = jest.fn();

jest.mock('@core/helpers/system-helper', () => ({
  useIsMobile: () => useIsMobile(),
}));

const mockUseWorkarea = jest.fn();

jest.mock('@core/helpers/hooks/useWorkarea', () => () => mockUseWorkarea());

const mockPopUp = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({
  popUp: (...args) => mockPopUp(...args),
}));

const mockTogglePresprayArea = jest.fn();

jest.mock('@core/app/actions/canvas/prespray-area', () => ({
  togglePresprayArea: () => mockTogglePresprayArea(),
}));

const mockUpdateLayerColor = jest.fn();

jest.mock(
  '@core/helpers/color/updateLayerColor',
  () =>
    (...args) =>
      mockUpdateLayerColor(...args),
);

const mockGetCurrentLayerName = jest.fn();
const mockGetLayerName = jest.fn();

const mockElem = {
  getAttribute: jest.fn(),
};

const mockSelectOnlyLayer = jest.fn();
const mockRenameLayer = jest.fn();
const t = i18n.lang.beambox.right_panel.layer_panel.layers;

describe('test LayerContextMenu', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockUseWorkarea.mockReturnValue('ado1');
    mockMergeLayers.mockResolvedValue('mockLayer');
  });

  it('should render correctly when multiselecting', () => {
    mockGetLayerName.mockReturnValue('layer1');
    useLayerStore.setState({ selectedLayers: ['layer1', 'layer2'] });

    const { container } = render(
      <LayerContextMenu renameLayer={mockRenameLayer} selectOnlyLayer={mockSelectOnlyLayer} />,
    );

    expect(container).toMatchSnapshot();
    expect(mockUseWorkarea).toHaveBeenCalledTimes(1);
  });

  it('should render correctly when selecting last', () => {
    mockGetLayerName.mockReturnValue('layer1');
    useLayerStore.setState({ selectedLayers: ['layer1'] });

    const { container } = render(
      <LayerContextMenu renameLayer={mockRenameLayer} selectOnlyLayer={mockSelectOnlyLayer} />,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render correctly in mobile', () => {
    useIsMobile.mockReturnValue(true);
    mockGetLayerName.mockReturnValue('layer1');
    useLayerStore.setState({ selectedLayers: ['layer2'] });

    const { container } = render(
      <LayerContextMenu renameLayer={mockRenameLayer} selectOnlyLayer={mockSelectOnlyLayer} />,
    );

    expect(container).toMatchSnapshot();
  });

  test('rename layer should work', () => {
    useLayerStore.setState({ selectedLayers: ['layer2'] });

    const { getByText } = render(
      <LayerContextMenu renameLayer={mockRenameLayer} selectOnlyLayer={mockSelectOnlyLayer} />,
    );

    expect(mockSelectOnlyLayer).not.toHaveBeenCalled();
    expect(mockRenameLayer).not.toHaveBeenCalled();
    fireEvent.click(getByText(t.rename));
    expect(mockSelectOnlyLayer).toHaveBeenCalledTimes(1);
    expect(mockSelectOnlyLayer).toHaveBeenLastCalledWith('layer2');
    expect(mockRenameLayer).toHaveBeenCalledTimes(1);
  });

  test('cloneLayers should work', () => {
    useLayerStore.setState({ selectedLayers: ['layer1', 'layer2'] });

    const { getByText } = render(
      <LayerContextMenu renameLayer={mockRenameLayer} selectOnlyLayer={mockSelectOnlyLayer} />,
    );

    expect(mockCloneLayers).not.toHaveBeenCalled();
    mockCloneLayers.mockReturnValue(['layer1 copy', 'layer2 copy']);
    expect(mockSetSelectedLayers).not.toHaveBeenCalled();
    fireEvent.click(getByText(t.dupe));
    expect(mockCloneLayers).toHaveBeenCalledWith(['layer1', 'layer2']);
    expect(mockSetSelectedLayers).toHaveBeenCalledWith(['layer1 copy', 'layer2 copy']);
  });

  test('lock layers should work', () => {
    useLayerStore.setState({ selectedLayers: ['layer1', 'layer2'] });

    const { getByText } = render(
      <LayerContextMenu renameLayer={mockRenameLayer} selectOnlyLayer={mockSelectOnlyLayer} />,
    );

    expect(mockClearSelection).not.toHaveBeenCalled();
    expect(mockSetLayersLock).not.toHaveBeenCalled();
    expect(mockSetSelectedLayers).not.toHaveBeenCalled();
    fireEvent.click(getByText(t.lock));
    expect(mockClearSelection).toHaveBeenCalledTimes(1);
    expect(mockSetLayersLock).toHaveBeenCalledTimes(1);
    expect(mockSetLayersLock).toHaveBeenCalledWith(['layer1', 'layer2'], true);
    expect(mockForceUpdate).toHaveBeenCalledTimes(1);
  });

  test('unlock layers should work', () => {
    useIsMobile.mockReturnValue(true);
    mockGetLayerElementByName.mockReturnValue(mockElem);
    mockElem.getAttribute.mockReturnValue('true');
    useLayerStore.setState({ selectedLayers: ['layer1'] });

    const { container, getByText } = render(
      <LayerContextMenu renameLayer={mockRenameLayer} selectOnlyLayer={mockSelectOnlyLayer} />,
    );

    expect(container).toMatchSnapshot();
    expect(mockClearSelection).not.toHaveBeenCalled();
    expect(mockSetLayersLock).not.toHaveBeenCalled();
    expect(mockSetSelectedLayers).not.toHaveBeenCalled();
    fireEvent.click(getByText(t.unlock));
    expect(mockClearSelection).toHaveBeenCalledTimes(1);
    expect(mockSetLayersLock).toHaveBeenCalledTimes(1);
    expect(mockSetLayersLock).toHaveBeenCalledWith(['layer1'], false);
    expect(mockForceUpdate).toHaveBeenCalledTimes(1);
  });

  test('deleteLayers should work', () => {
    useLayerStore.setState({ selectedLayers: ['layer1', 'layer2'] });

    const { getByText } = render(
      <LayerContextMenu renameLayer={mockRenameLayer} selectOnlyLayer={mockSelectOnlyLayer} />,
    );

    expect(mockDeleteLayers).not.toHaveBeenCalled();
    expect(mockSetSelectedLayers).not.toHaveBeenCalled();
    expect(mockTogglePresprayArea).not.toHaveBeenCalled();
    fireEvent.click(getByText(t.del));
    expect(mockDeleteLayers).toHaveBeenCalledWith(['layer1', 'layer2']);
    expect(mockSetSelectedLayers).toHaveBeenCalledWith([]);
    expect(mockTogglePresprayArea).toHaveBeenCalledTimes(1);
  });

  test('merge down should work', async () => {
    useLayerStore.setState({ selectedLayers: ['layer1'] });

    const { getByText } = render(
      <LayerContextMenu renameLayer={mockRenameLayer} selectOnlyLayer={mockSelectOnlyLayer} />,
    );

    mockGetLayerPosition.mockReturnValue(1);
    mockGetLayerName.mockReturnValue('layer2');
    expect(mockMergeLayers).not.toHaveBeenCalled();
    expect(mockSetSelectedLayers).not.toHaveBeenCalled();
    fireEvent.click(getByText(t.merge_down));
    expect(mockGetLayerPosition).toHaveBeenCalledTimes(1);
    expect(mockGetLayerPosition).toHaveBeenCalledWith('layer1');
    expect(mockGetLayerName).toHaveBeenCalledTimes(2);
    expect(mockGetLayerName).toHaveBeenLastCalledWith(0);
    expect(mockMergeLayers).toHaveBeenCalledWith(['layer1'], 'layer2');
    await waitFor(() => {
      expect(mockSelectOnlyLayer).toHaveBeenCalledTimes(1);
      expect(mockSelectOnlyLayer).toHaveBeenLastCalledWith('layer2');
    });
  });

  test('merge all should work', async () => {
    mockGetAllLayerNames.mockReturnValue(['layer1', 'layer2', 'layer3']);
    useLayerStore.setState({ selectedLayers: ['layer2'] });

    const { getByText } = render(
      <LayerContextMenu renameLayer={mockRenameLayer} selectOnlyLayer={mockSelectOnlyLayer} />,
    );

    expect(mockMergeLayers).not.toHaveBeenCalled();
    mockMergeLayers.mockReturnValue('layer1');
    expect(mockSetSelectedLayers).not.toHaveBeenCalled();
    mockGetLayerElementByName.mockReturnValue(mockElem);
    mockElem.getAttribute.mockReturnValue('1');
    fireEvent.click(getByText(t.merge_all));
    expect(mockGetAllLayerNames).toHaveBeenCalledTimes(1);
    expect(mockMergeLayers).toHaveBeenCalledTimes(1);
    expect(mockMergeLayers).toHaveBeenLastCalledWith(['layer1', 'layer2', 'layer3']);
    await waitFor(() => {
      expect(mockSelectOnlyLayer).toHaveBeenCalledTimes(1);
      expect(mockSelectOnlyLayer).toHaveBeenLastCalledWith('layer1');
      expect(mockUpdateLayerColor).toHaveBeenCalledTimes(1);
      expect(mockUpdateLayerColor).toHaveBeenLastCalledWith(mockElem);
    });
  });

  test('merge selected should work', async () => {
    useLayerStore.setState({ selectedLayers: ['layer1', 'layer2'] });

    const { getByText } = render(
      <LayerContextMenu renameLayer={mockRenameLayer} selectOnlyLayer={mockSelectOnlyLayer} />,
    );

    mockGetCurrentLayerName.mockReturnValue('layer2');
    mockMergeLayers.mockReturnValue('layer2');
    expect(mockGetCurrentLayerName).not.toHaveBeenCalled();
    expect(mockMergeLayers).not.toHaveBeenCalled();
    mockGetLayerElementByName.mockReturnValue(mockElem);
    mockElem.getAttribute.mockReturnValue('0');
    fireEvent.click(getByText(t.merge_selected));
    expect(mockGetCurrentLayerName).toHaveBeenCalledTimes(1);
    expect(mockMergeLayers).toHaveBeenCalledTimes(1);
    expect(mockMergeLayers).toHaveBeenLastCalledWith(['layer1', 'layer2'], 'layer2');
    await waitFor(() => {
      expect(mockSetSelectedLayers).toHaveBeenCalledTimes(1);
      expect(mockSetSelectedLayers).toHaveBeenLastCalledWith(['layer2']);
      expect(mockGetLayerElementByName).toHaveBeenCalledTimes(2);
      expect(mockGetLayerElementByName).toHaveBeenLastCalledWith('layer2');
      expect(mockUpdateLayerColor).toHaveBeenCalledTimes(1);
      expect(mockUpdateLayerColor).toHaveBeenLastCalledWith(mockElem);
    });
  });

  it('should render correctly when selecting printing layer', async () => {
    mockGetLayerName.mockReturnValue('layer1');
    mockGetLayerElementByName.mockReturnValue(mockElem);
    mockGetData.mockReturnValueOnce(LayerModule.PRINTER).mockReturnValueOnce(false);
    useLayerStore.getState().setSelectedLayers(['layer1']);

    const { container } = render(
      <LayerContextMenu renameLayer={mockRenameLayer} selectOnlyLayer={mockSelectOnlyLayer} />,
    );

    expect(mockGetLayerElementByName).toHaveBeenCalledTimes(1);
    expect(mockGetLayerElementByName).toHaveBeenLastCalledWith('layer1');
    expect(mockGetData).toHaveBeenCalledTimes(3);
    expect(mockGetData).toHaveBeenNthCalledWith(1, mockElem, 'module');
    expect(mockGetData).toHaveBeenNthCalledWith(2, mockElem, 'fullcolor');
    expect(mockGetData).toHaveBeenNthCalledWith(3, mockElem, 'split');
    expect(container).toMatchSnapshot();
  });

  test('click split color should work', async () => {
    mockGetLayerName.mockReturnValue('layer1');
    mockGetLayerElementByName.mockReturnValue(mockElem);
    mockGetData.mockReturnValueOnce(LayerModule.PRINTER).mockReturnValueOnce(true);
    useLayerStore.setState({ selectedLayers: ['layer1'] });

    const { getByText } = render(
      <LayerContextMenu renameLayer={mockRenameLayer} selectOnlyLayer={mockSelectOnlyLayer} />,
    );

    expect(mockSplitFullColorLayer).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.click(getByText(t.splitFullColor));
    });
    expect(mockPopUp).toHaveBeenCalledTimes(1);
    mockPopUp.mock.calls[0][0].onConfirm();
    await waitFor(() => {
      expect(mockSplitFullColorLayer).toHaveBeenCalledTimes(1);
      expect(mockSplitFullColorLayer).toHaveBeenLastCalledWith('layer1');
      expect(mockForceUpdate).toHaveBeenCalledTimes(1);
    });
  });

  test('click toggle full color should work', async () => {
    mockGetLayerName.mockReturnValue('layer1');
    mockGetLayerElementByName.mockReturnValue(mockElem);
    mockGetData.mockReturnValueOnce(LayerModule.PRINTER).mockReturnValueOnce(false);
    mockElem.getAttribute.mockReturnValueOnce('false');
    useLayerStore.setState({ selectedLayers: ['layer1'] });

    const { getByText } = render(
      <LayerContextMenu renameLayer={mockRenameLayer} selectOnlyLayer={mockSelectOnlyLayer} />,
    );

    expect(mockSplitFullColorLayer).not.toHaveBeenCalled();

    const mockCmd = {
      isEmpty: jest.fn(),
    };

    mockToggleFullColorLayer.mockReturnValue(mockCmd);
    mockCmd.isEmpty.mockReturnValue(false);
    await act(async () => {
      fireEvent.click(getByText(t.switchToFullColor));
    });
    expect(mockElem.getAttribute).toHaveBeenCalledTimes(1);
    expect(mockElem.getAttribute).toHaveBeenNthCalledWith(1, 'data-lock');
    expect(mockToggleFullColorLayer).toHaveBeenCalledTimes(1);
    expect(mockToggleFullColorLayer).toHaveBeenLastCalledWith(mockElem);
    expect(mockForceUpdate).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenLastCalledWith(mockCmd);
    expect(mockCmd.isEmpty).toHaveBeenCalledTimes(1);
  });
});
