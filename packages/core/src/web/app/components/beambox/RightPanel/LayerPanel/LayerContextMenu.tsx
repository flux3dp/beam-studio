import type { ReactNode } from 'react';
import React, { use, useState } from 'react';

import { EllipsisOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { pick } from 'remeda';
import { useShallow } from 'zustand/shallow';

import alertCaller from '@core/app/actions/alert-caller';
import { modelsWithModules } from '@core/app/actions/beambox/constant';
import presprayArea from '@core/app/actions/canvas/prespray-area';
import ListButtonGroup from '@core/app/components/common/ListButtonGroup';
import Popover from '@core/app/components/dialogs/popover/Popover';
import alertConstants from '@core/app/constants/alert-constants';
import colorConstants from '@core/app/constants/color-constants';
import type { PrintingColors } from '@core/app/constants/color-constants';
import { printingModules } from '@core/app/constants/layer-module/layer-modules';
import LayerPanelIcons from '@core/app/icons/layer-panel/LayerPanelIcons';
import ObjectPanelIcons from '@core/app/icons/object-panel/ObjectPanelIcons';
import useLayerStore from '@core/app/stores/layer/layerStore';
import { useIsTabletOrMobile } from '@core/app/stores/screenStore';
import undoManager from '@core/app/svgedit/history/undoManager';
import layerManager from '@core/app/svgedit/layer/layerManager';
import selectionManager from '@core/app/svgedit/selection';
import ContextMenu from '@core/app/widgets/ContextMenu';
import updateLayerColor from '@core/helpers/color/updateLayerColor';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import { mockT } from '@core/helpers/is-dev';
import { deleteLayers } from '@core/helpers/layer/deleteLayer';
import splitFullColorLayer from '@core/helpers/layer/full-color/splitFullColorLayer';
import toggleFullColorLayer from '@core/helpers/layer/full-color/toggleFullColorLayer';
import { getData } from '@core/helpers/layer/layer-config-helper';
import {
  cloneLayers,
  getLayerPosition,
  mergeLayers,
  renameLayer,
  selectOnlyLayer,
  setLayersLock,
} from '@core/helpers/layer/layer-helper';
import useI18n from '@core/helpers/useI18n';

import { ObjectPanelContext } from '../contexts/ObjectPanelContext';

interface Props {
  children?: ReactNode;
}

const LayerContextMenu = ({ children }: Props): React.JSX.Element => {
  const lang = useI18n();
  const LANG = lang.beambox.right_panel.layer_panel;
  const LANG2 = lang.alert;
  const workarea = useWorkarea();
  const { forceUpdate, selectedLayers, setSelectedLayers } = useLayerStore(
    useShallow(pick(['forceUpdate', 'selectedLayers', 'setSelectedLayers'])),
  );
  const isTablet = useIsTabletOrMobile();
  const { activeKey, updateActiveKey } = use(ObjectPanelContext);
  const [color, setColor] = useState(colorConstants.printingLayerColor[0]);
  const layerElem = layerManager.getLayerElementByName(selectedLayers[0])!;
  const isLocked = layerElem?.getAttribute('data-lock') === 'true';
  const handleContextMenu = (e: React.MouseEvent) => {
    const target = e.target as Element;
    const layerItem = target?.closest('.layer-item');
    const layerName = layerItem?.getAttribute('data-layer');

    if (layerName && !selectedLayers.includes(layerName)) {
      selectOnlyLayer(layerName);
    }
  };

  const handleRename = () => {
    selectOnlyLayer(selectedLayers[0]);
    renameLayer();
  };

  const handleCloneLayers = () => {
    const newLayers = cloneLayers(selectedLayers);

    setSelectedLayers(newLayers);
  };

  const handleDeleteLayers = () => {
    deleteLayers(selectedLayers);
    setSelectedLayers([]);
    presprayArea.togglePresprayArea();
  };

  const toggleLayerLocked = () => {
    selectionManager.clearSelection();
    setLayersLock(selectedLayers, !isLocked);
    forceUpdate();
  };

  const handleMergeDown = async () => {
    const layer = selectedLayers[0];
    const layerPosition = getLayerPosition(layer);

    if (layerPosition === 0) {
      return;
    }

    const baseLayerName = layerManager.getLayerName(layerPosition - 1)!;
    const merged = await mergeLayers([layer], baseLayerName);

    if (merged) {
      selectOnlyLayer(baseLayerName);
    }
  };

  const handleMergeAll = async () => {
    const allLayerNames = layerManager.getAllLayerNames();
    const baseLayerName = await mergeLayers(allLayerNames);

    if (!baseLayerName) {
      return;
    }

    const elem = layerManager.getLayerElementByName(baseLayerName!);

    updateLayerColor(elem as SVGGElement);
    selectOnlyLayer(baseLayerName);
  };

  const handleMergeSelected = async () => {
    const currentLayerName = layerManager.getCurrentLayerName()!;
    const baseLayer = await mergeLayers(selectedLayers, currentLayerName);

    if (!baseLayer) {
      return;
    }

    const elem = layerManager.getLayerElementByName(baseLayer!);

    updateLayerColor(elem as SVGGElement);
    setSelectedLayers([baseLayer]);
  };

  const isSelectingPrinterLayer =
    selectedLayers.length === 1 &&
    layerElem &&
    modelsWithModules.has(workarea) &&
    printingModules.has(getData(layerElem, 'module')!);
  const isFullColor = getData(layerElem, 'fullcolor');
  const isSplitLayer = getData(layerElem, 'split');

  const handleSplitColor = async () => {
    if (!isSelectingPrinterLayer || isSplitLayer) {
      return;
    }

    const res = await new Promise<boolean>((resolve) => {
      alertCaller.popUp({
        buttonType: alertConstants.CONFIRM_CANCEL,
        caption: LANG.notification.splitColorTitle,
        id: 'split-color',
        message: LANG.notification.splitColorMsg,
        messageIcon: 'notice',
        onCancel: () => resolve(false),
        onConfirm: () => resolve(true),
      });
    });

    if (!res) {
      return;
    }

    const layer = selectedLayers[0];

    await splitFullColorLayer(layer);
    setSelectedLayers([]);
  };

  const handleLayerFullColor = (newColor?: string) => {
    selectionManager.clearSelection();

    if (!isSelectingPrinterLayer) {
      return;
    }

    if (
      isFullColor &&
      (newColor || !colorConstants.printingLayerColor.includes(layerElem.getAttribute('data-color') as PrintingColors))
    ) {
      layerElem.setAttribute('data-color', newColor || colorConstants.printingLayerColor[0]);
    }

    const cmd = toggleFullColorLayer(layerElem);

    if (cmd && !cmd.isEmpty()) {
      undoManager.addCommandToHistory(cmd);
    }

    forceUpdate();
  };

  const isMultiSelecting = selectedLayers.length > 1;
  const isSelectingLast = selectedLayers.length === 1 && layerManager.getLayerName(0) === selectedLayers[0];
  const items = [
    { disabled: isMultiSelecting, key: 'renameLayer', label: LANG.layers.rename, onClick: handleRename },
    { key: 'dupelayer', label: LANG.layers.dupe, onClick: handleCloneLayers },
    {
      key: 'locklayer',
      label: isLocked ? LANG.layers.unlock : LANG.layers.lock,
      onClick: toggleLayerLocked,
    },
    { key: 'deletelayer', label: LANG.layers.del, onClick: handleDeleteLayers },
    {
      disabled: isMultiSelecting || isSelectingLast,
      key: 'merge_down_layer',
      label: LANG.layers.merge_down,
      onClick: handleMergeDown,
    },
    {
      disabled: isMultiSelecting,
      key: 'merge_all_layer',
      label: LANG.layers.merge_all,
      onClick: handleMergeAll,
    },
    {
      disabled: !isMultiSelecting,
      key: 'merge_selected_layer',
      label: LANG.layers.merge_selected,
      onClick: handleMergeSelected,
    },
    ...(isSelectingPrinterLayer
      ? [
          {
            disabled: isMultiSelecting || isSplitLayer,
            key: 'toggle_fullcolor_layer',
            label: isFullColor ? LANG.layers.switchToSingleColor : LANG.layers.switchToFullColor,
            onClick: () => handleLayerFullColor(),
          },
          {
            disabled: isMultiSelecting || !isFullColor,
            key: 'split_color',
            label: LANG.layers.splitFullColor,
            onClick: handleSplitColor,
          },
        ]
      : []),
  ] satisfies MenuProps['items'];
  const mobileIcons = {
    deletelayer: <ObjectPanelIcons.Trash />,
    dupelayer: <ObjectPanelIcons.Duplicate />,
    locklayer: isLocked ? <LayerPanelIcons.Unlock /> : <LayerPanelIcons.Lock />,
    merge_down_layer: <LayerPanelIcons.Merge />,
    renameLayer: <LayerPanelIcons.Rename />,
    split_color: <LayerPanelIcons.Expand />,
  };

  return isTablet ? (
    <Popover placement="bottomLeft" title={mockT('更多功能')} triggerProps={{ icon: <EllipsisOutlined /> }}>
      <ListButtonGroup
        items={items.map(({ disabled, key, label, onClick }) => ({
          children: label,
          disabled,
          icon: mobileIcons[key as keyof typeof mobileIcons],
          key,
          onClick,
        }))}
      />
    </Popover>
  ) : (
    <ContextMenu items={items}>
      <div onContextMenu={handleContextMenu}>{children}</div>
    </ContextMenu>
  );
};

export default LayerContextMenu;
