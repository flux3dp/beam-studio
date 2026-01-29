import React, { useContext, useState } from 'react';

import { Button, Switch } from 'antd';
import { Popover } from 'antd-mobile';
import classNames from 'classnames';
import { pick } from 'remeda';
import { useShallow } from 'zustand/shallow';

import alertCaller from '@core/app/actions/alert-caller';
import { modelsWithModules } from '@core/app/actions/beambox/constant';
import presprayArea from '@core/app/actions/canvas/prespray-area';
import alertConstants from '@core/app/constants/alert-constants';
import colorConstants from '@core/app/constants/color-constants';
import type { PrintingColors } from '@core/app/constants/color-constants';
import { printingModules } from '@core/app/constants/layer-module/layer-modules';
import LayerPanelIcons from '@core/app/icons/layer-panel/LayerPanelIcons';
import ObjectPanelIcons from '@core/app/icons/object-panel/ObjectPanelIcons';
import useLayerStore from '@core/app/stores/layer/layerStore';
import undoManager from '@core/app/svgedit/history/undoManager';
import layerManager from '@core/app/svgedit/layer/layerManager';
import { ObjectPanelContext } from '@core/app/views/beambox/Right-Panels/contexts/ObjectPanelContext';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import colorPickerStyles from '@core/app/widgets/ColorPicker.module.scss';
import updateLayerColor from '@core/helpers/color/updateLayerColor';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import { deleteLayers } from '@core/helpers/layer/deleteLayer';
import splitFullColorLayer from '@core/helpers/layer/full-color/splitFullColorLayer';
import toggleFullColorLayer from '@core/helpers/layer/full-color/toggleFullColorLayer';
import { getData } from '@core/helpers/layer/layer-config-helper';
import { cloneLayers, getLayerPosition, mergeLayers, setLayersLock } from '@core/helpers/layer/layer-helper';
import { ContextMenu, MenuItem } from '@core/helpers/react-contextmenu';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import styles from './LayerContextMenu.module.scss';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

interface Props {
  renameLayer: () => void;
  selectOnlyLayer: (name: string) => void;
}

const LayerContextMenu = ({ renameLayer, selectOnlyLayer }: Props): React.JSX.Element => {
  const lang = useI18n();
  const LANG = lang.beambox.right_panel.layer_panel;
  const LANG2 = lang.alert;
  const workarea = useWorkarea();
  const { forceUpdate, selectedLayers, setSelectedLayers } = useLayerStore(
    useShallow(pick(['forceUpdate', 'selectedLayers', 'setSelectedLayers'])),
  );
  const isMobile = useIsMobile();
  const { activeKey, updateActiveKey } = useContext(ObjectPanelContext);
  const [color, setColor] = useState(colorConstants.printingLayerColor[0]);
  const layerElem = layerManager.getLayerElementByName(selectedLayers[0])!;
  const isLocked = layerElem?.getAttribute('data-lock') === 'true';
  const onContextMenuShow = (e: CustomEvent) => {
    const trigger = e.detail.data?.target as Element;
    const layerItem = trigger?.closest('.layer-item');
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
    svgCanvas.clearSelection();
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
    forceUpdate();
  };

  const handleLayerFullColor = (newColor?: string) => {
    svgCanvas.clearSelection();

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

  return isMobile ? (
    <div className={styles['item-group']}>
      <ObjectPanelItem.Divider />
      {isSelectingPrinterLayer && (
        <ObjectPanelItem.Item
          content={<LayerPanelIcons.Expand />}
          disabled={isMultiSelecting || !isFullColor}
          id="split_color"
          label={LANG.layers.splitFullColor}
          onClick={handleSplitColor}
        />
      )}
      {isSelectingPrinterLayer && (
        <Popover
          content={
            <>
              <div className={colorPickerStyles.preset}>
                {colorConstants.printingLayerColor.map((preset) => (
                  <div
                    className={classNames(
                      colorPickerStyles['preset-block'],
                      colorPickerStyles.color,
                      colorPickerStyles.printing,
                      { [colorPickerStyles.checked]: preset === color },
                    )}
                    key={preset}
                    onClick={() => setColor(preset)}
                  >
                    <div className={colorPickerStyles.inner} style={{ backgroundColor: preset }} />
                  </div>
                ))}
              </div>
              <div className={colorPickerStyles.footer}>
                <Button
                  className={colorPickerStyles.btn}
                  onClick={() => {
                    updateActiveKey(null);
                    handleLayerFullColor(color);
                    setColor(colorConstants.printingLayerColor[0]);
                  }}
                  type="primary"
                >
                  {LANG2.ok}
                </Button>
                <Button
                  className={colorPickerStyles.btn}
                  onClick={() => {
                    updateActiveKey(null);
                    setColor(colorConstants.printingLayerColor[0]);
                  }}
                  type="default"
                >
                  {LANG2.cancel}
                </Button>
              </div>
            </>
          }
          visible={activeKey === 'toggle_fullcolor_layer' && isFullColor}
        >
          <ObjectPanelItem.Item
            autoClose={false}
            content={<Switch checked={isFullColor} />}
            disabled={isMultiSelecting || isSplitLayer}
            id="toggle_fullcolor_layer"
            label={LANG.layers.fullColor}
            onClick={() => {
              if (!isFullColor && !isSplitLayer) {
                handleLayerFullColor();
                updateActiveKey(null);
              }
            }}
          />
        </Popover>
      )}
      <ObjectPanelItem.Item
        content={<ObjectPanelIcons.Trash />}
        id="deletelayer"
        label={LANG.layers.del}
        onClick={handleDeleteLayers}
      />
      <ObjectPanelItem.Item
        content={<LayerPanelIcons.Merge />}
        disabled={isMultiSelecting || isSelectingLast}
        id="merge_down_layer"
        label={LANG.layers.merge_down}
        onClick={handleMergeDown}
      />
      <ObjectPanelItem.Item
        content={isLocked ? <LayerPanelIcons.Unlock /> : <LayerPanelIcons.Lock />}
        id="locklayer"
        label={isLocked ? LANG.layers.unlock : LANG.layers.lock}
        onClick={toggleLayerLocked}
      />
      <ObjectPanelItem.Item
        content={<ObjectPanelIcons.Duplicate />}
        id="dupelayer"
        label={LANG.layers.dupe}
        onClick={handleCloneLayers}
      />
      <ObjectPanelItem.Item
        content={<LayerPanelIcons.Rename />}
        disabled={isMultiSelecting}
        id="renameLayer"
        label={LANG.layers.rename}
        onClick={handleRename}
      />
    </div>
  ) : (
    <ContextMenu id="layer-contextmenu" onShow={onContextMenuShow}>
      <MenuItem attributes={{ id: 'renameLayer' }} disabled={isMultiSelecting} onClick={handleRename}>
        {LANG.layers.rename}
      </MenuItem>
      <MenuItem attributes={{ id: 'dupelayer' }} onClick={handleCloneLayers}>
        {LANG.layers.dupe}
      </MenuItem>
      <MenuItem attributes={{ id: 'locklayer' }} onClick={toggleLayerLocked}>
        {isLocked ? LANG.layers.unlock : LANG.layers.lock}
      </MenuItem>
      <MenuItem attributes={{ id: 'deletelayer' }} onClick={handleDeleteLayers}>
        {LANG.layers.del}
      </MenuItem>
      <MenuItem
        attributes={{ id: 'merge_down_layer' }}
        disabled={isMultiSelecting || isSelectingLast}
        onClick={handleMergeDown}
      >
        {LANG.layers.merge_down}
      </MenuItem>
      <MenuItem attributes={{ id: 'merge_all_layer' }} disabled={isMultiSelecting} onClick={handleMergeAll}>
        {LANG.layers.merge_all}
      </MenuItem>
      <MenuItem attributes={{ id: 'merge_selected_layer' }} disabled={!isMultiSelecting} onClick={handleMergeSelected}>
        {LANG.layers.merge_selected}
      </MenuItem>
      {isSelectingPrinterLayer && (
        <>
          <MenuItem
            attributes={{ id: 'toggle_fullcolor_layer' }}
            disabled={isMultiSelecting || isSplitLayer}
            onClick={() => handleLayerFullColor()}
          >
            {isFullColor ? LANG.layers.switchToSingleColor : LANG.layers.switchToFullColor}
          </MenuItem>
          <MenuItem
            attributes={{ id: 'split_color' }}
            disabled={isMultiSelecting || !isFullColor}
            onClick={handleSplitColor}
          >
            {LANG.layers.splitFullColor}
          </MenuItem>
        </>
      )}
    </ContextMenu>
  );
};

export default LayerContextMenu;
