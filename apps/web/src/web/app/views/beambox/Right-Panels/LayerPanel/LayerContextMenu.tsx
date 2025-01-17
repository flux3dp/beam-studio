import classNames from 'classnames';
import React, { useContext, useState } from 'react';
import { Button, Switch } from 'antd';
import { Popover } from 'antd-mobile';

import alertCaller from 'app/actions/alert-caller';
import alertConstants from 'app/constants/alert-constants';
import colorConstants, { PrintingColors } from 'app/constants/color-constants';
import colorPickerStyles from 'app/widgets/ColorPicker.module.scss';
import ISVGDrawing from 'interfaces/ISVGDrawing';
import LayerModule, { modelsWithModules } from 'app/constants/layer-module/layer-modules';
import LayerPanelIcons from 'app/icons/layer-panel/LayerPanelIcons';
import ObjectPanelIcons from 'app/icons/object-panel/ObjectPanelIcons';
import ObjectPanelItem from 'app/views/beambox/Right-Panels/ObjectPanelItem';
import presprayArea from 'app/actions/canvas/prespray-area';
import splitFullColorLayer from 'helpers/layer/full-color/splitFullColorLayer';
import toggleFullColorLayer from 'helpers/layer/full-color/toggleFullColorLayer';
import updateLayerColor from 'helpers/color/updateLayerColor';
import useI18n from 'helpers/useI18n';
import useWorkarea from 'helpers/hooks/useWorkarea';
import { ContextMenu, MenuItem } from 'helpers/react-contextmenu';
import {
  cloneLayers,
  deleteLayers,
  getAllLayerNames,
  getLayerElementByName,
  getLayerPosition,
  mergeLayers,
  setLayersLock,
} from 'helpers/layer/layer-helper';
import { getData } from 'helpers/layer/layer-config-helper';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { LayerPanelContext } from 'app/views/beambox/Right-Panels/contexts/LayerPanelContext';
import { ObjectPanelContext } from 'app/views/beambox/Right-Panels/contexts/ObjectPanelContext';
import { useIsMobile } from 'helpers/system-helper';

import styles from './LayerContextMenu.module.scss';

let svgCanvas;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

interface Props {
  drawing: ISVGDrawing;
  selectOnlyLayer: (name: string) => void;
  renameLayer: () => void;
}

const LayerContextMenu = ({ drawing, selectOnlyLayer, renameLayer }: Props): JSX.Element => {
  const lang = useI18n();
  const LANG = lang.beambox.right_panel.layer_panel;
  const LANG2 = lang.alert;
  const workarea = useWorkarea();
  const { selectedLayers, setSelectedLayers, forceUpdate } = useContext(LayerPanelContext);
  const isMobile = useIsMobile();
  const { activeKey, updateActiveKey } = useContext(ObjectPanelContext);
  const [color, setColor] = useState(colorConstants.printingLayerColor[0]);
  const layerElem = getLayerElementByName(selectedLayers[0]);
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
    if (layerPosition === 0) return;
    const baseLayerName = drawing.getLayerName(layerPosition - 1);
    const merged = await mergeLayers([layer], baseLayerName);
    if (merged) selectOnlyLayer(baseLayerName);
  };

  const handleMergeAll = async () => {
    const allLayerNames = getAllLayerNames();
    const baseLayerName = await mergeLayers(allLayerNames);
    if (!baseLayerName) return;
    const elem = getLayerElementByName(baseLayerName);
    updateLayerColor(elem as SVGGElement);
    selectOnlyLayer(baseLayerName);
  };

  const handleMergeSelected = async () => {
    const currentLayerName = drawing.getCurrentLayerName();
    const baseLayer = await mergeLayers(selectedLayers, currentLayerName);
    if (!baseLayer) return;
    const elem = getLayerElementByName(baseLayer);
    updateLayerColor(elem as SVGGElement);
    setSelectedLayers([baseLayer]);
  };

  const isSelectingPrinterLayer =
    selectedLayers.length === 1 &&
    layerElem &&
    modelsWithModules.has(workarea) &&
    getData(layerElem, 'module') === LayerModule.PRINTER;
  const isFullColor = getData(layerElem, 'fullcolor');
  const isSplitLayer = getData(layerElem, 'split');

  const handleSplitColor = async () => {
    svgCanvas.clearSelection();
    if (!isSelectingPrinterLayer || isSplitLayer) return;
    const res = await new Promise<boolean>((resolve) => {
      alertCaller.popUp({
        id: 'split-color',
        caption: LANG.notification.splitColorTitle,
        message: LANG.notification.splitColorMsg,
        messageIcon: 'notice',
        buttonType: alertConstants.CONFIRM_CANCEL,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
    if (!res) return;
    const layer = selectedLayers[0];
    await splitFullColorLayer(layer);
    setSelectedLayers([]);
  };

  const handleLayerFullColor = (newColor?: string) => {
    svgCanvas.clearSelection();
    if (!isSelectingPrinterLayer) return;
    if (
      isFullColor &&
      (newColor ||
        !colorConstants.printingLayerColor.includes(
          layerElem.getAttribute('data-color') as PrintingColors
        ))
    ) {
      layerElem.setAttribute('data-color', newColor || colorConstants.printingLayerColor[0]);
    }
    const cmd = toggleFullColorLayer(layerElem);
    if (cmd && !cmd.isEmpty()) svgCanvas.undoMgr.addCommandToHistory(cmd);
    setSelectedLayers([]);
  };

  const isMultiSelecting = selectedLayers.length > 1;
  const isSelectingLast =
    selectedLayers.length === 1 && drawing.getLayerName(0) === selectedLayers[0];

  return isMobile ? (
    <div className={styles['item-group']}>
      <ObjectPanelItem.Divider />
      {isSelectingPrinterLayer && (
        <ObjectPanelItem.Item
          id="split_color"
          content={<LayerPanelIcons.Expand />}
          label={LANG.layers.splitFullColor}
          onClick={handleSplitColor}
          disabled={isMultiSelecting || !isFullColor}
        />
      )}
      {isSelectingPrinterLayer && (
        <Popover
          visible={activeKey === 'toggle_fullcolor_layer' && isFullColor}
          content={
            <>
              <div className={colorPickerStyles.preset}>
                {colorConstants.printingLayerColor.map((preset) => (
                  <div
                    key={preset}
                    className={classNames(
                      colorPickerStyles['preset-block'],
                      colorPickerStyles.color,
                      colorPickerStyles.printing,
                      { [colorPickerStyles.checked]: preset === color }
                    )}
                    onClick={() => setColor(preset)}
                  >
                    <div className={colorPickerStyles.inner} style={{ backgroundColor: preset }} />
                  </div>
                ))}
              </div>
              <div className={colorPickerStyles.footer}>
                <Button
                  type="primary"
                  className={colorPickerStyles.btn}
                  onClick={() => {
                    updateActiveKey(null);
                    handleLayerFullColor(color);
                    setColor(colorConstants.printingLayerColor[0]);
                  }}
                >
                  {LANG2.ok}
                </Button>
                <Button
                  type="default"
                  className={colorPickerStyles.btn}
                  onClick={() => {
                    updateActiveKey(null);
                    setColor(colorConstants.printingLayerColor[0]);
                  }}
                >
                  {LANG2.cancel}
                </Button>
              </div>
            </>
          }
        >
          <ObjectPanelItem.Item
            id="toggle_fullcolor_layer"
            content={<Switch checked={isFullColor} />}
            label={LANG.layers.fullColor}
            onClick={() => {
              if (!isFullColor && !isSplitLayer) {
                handleLayerFullColor();
                updateActiveKey(null);
              }
            }}
            disabled={isMultiSelecting || isSplitLayer}
            autoClose={false}
          />
        </Popover>
      )}
      <ObjectPanelItem.Item
        id="deletelayer"
        content={<ObjectPanelIcons.Trash />}
        label={LANG.layers.del}
        onClick={handleDeleteLayers}
      />
      <ObjectPanelItem.Item
        id="merge_down_layer"
        content={<LayerPanelIcons.Merge />}
        label={LANG.layers.merge_down}
        onClick={handleMergeDown}
        disabled={isMultiSelecting || isSelectingLast}
      />
      <ObjectPanelItem.Item
        id="locklayer"
        content={isLocked ? <LayerPanelIcons.Unlock /> : <LayerPanelIcons.Lock />}
        label={isLocked ? LANG.layers.unlock : LANG.layers.lock}
        onClick={toggleLayerLocked}
      />
      <ObjectPanelItem.Item
        id="dupelayer"
        content={<ObjectPanelIcons.Duplicate />}
        label={LANG.layers.dupe}
        onClick={handleCloneLayers}
      />
      <ObjectPanelItem.Item
        id="renameLayer"
        content={<LayerPanelIcons.Rename />}
        label={LANG.layers.rename}
        onClick={handleRename}
        disabled={isMultiSelecting}
      />
    </div>
  ) : (
    <ContextMenu id="layer-contextmenu" onShow={onContextMenuShow}>
      <MenuItem
        attributes={{ id: 'renameLayer' }}
        disabled={isMultiSelecting}
        onClick={handleRename}
      >
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
      <MenuItem
        attributes={{ id: 'merge_all_layer' }}
        disabled={isMultiSelecting}
        onClick={handleMergeAll}
      >
        {LANG.layers.merge_all}
      </MenuItem>
      <MenuItem
        attributes={{ id: 'merge_selected_layer' }}
        disabled={!isMultiSelecting}
        onClick={handleMergeSelected}
      >
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
