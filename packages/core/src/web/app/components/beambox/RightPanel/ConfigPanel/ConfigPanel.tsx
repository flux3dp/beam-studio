import React, { memo, useEffect, useMemo, useState } from 'react';

import { ConfigProvider, Modal } from 'antd';
import classNames from 'classnames';
import { piped } from 'remeda';
import { sprintf } from 'sprintf-js';

import { promarkModels } from '@core/app/actions/beambox/constant';
import presprayArea from '@core/app/actions/canvas/prespray-area';
import dialogCaller from '@core/app/actions/dialog-caller';
import HighQualityBlock from '@core/app/components/beambox/RightPanel/ConfigPanel/HighQualityBlock';
import { getAddOnInfo } from '@core/app/constants/addOn';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { laserModules, LayerModule, UVModules } from '@core/app/constants/layer-module/layer-modules';
import { printingModules } from '@core/app/constants/layer-module/layer-modules';
import LayerPanelIcons from '@core/app/icons/layer-panel/LayerPanelIcons';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import { useConfigPanelStore } from '@core/app/stores/configPanel';
import { useLayerStore } from '@core/app/stores/layer/layerStore';
import history from '@core/app/svgedit/history/history';
import layerManager from '@core/app/svgedit/layer/layerManager';
import Select from '@core/app/widgets/AntdSelect';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import { useSupportedModules } from '@core/helpers/hooks/useSupportedModules';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import i18n from '@core/helpers/i18n';
import { getData, objectConfig, postPresetChange, writeDataLayer } from '@core/helpers/layer/layer-config-helper';
import { moveToOtherLayer } from '@core/helpers/layer/layer-helper';
import { useIsMaterialBrowserActive } from '@core/helpers/materials/isMaterialBrowserActive';
import { initMaterialBrowser } from '@core/helpers/materials/material-apply';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import useI18n from '@core/helpers/useI18n';
import type { ConfigKey } from '@core/interfaces/ILayerConfig';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import ColorBlock from '../ColorBlock';
import ObjectPanelController from '../contexts/ObjectPanelController';
import ObjectPanelItem from '../ObjectPanelItem';

import AdvancedBlock from './AdvancedBlock';
import AdvancedSettingButton from './AdvancedSettingButton';
import AirAssistBlock from './AirAssistBlock';
import styles from './ConfigPanel.module.scss';
import DevBlock from './DevBlock';
import DottingTimeBlock from './DottingTimeBlock';
import DpiBlock from './DpiBlock';
import FillIntervalBlock from './FillIntervalBlock';
import FrequencyBlock from './FrequencyBlock';
import HalftoneBlock from './HalftoneBlock';
import initState from './initState';
import InkBlock from './InkBlock';
import MaterialChip from './MaterialChip';
import ModuleBlock from './ModuleBlock';
import MultipassBlock from './MultipassBlock';
import ParameterTitle from './ParameterTitle';
import PowerBlock from './PowerBlock';
import PresetDropdown from './PresetDropdown';
import PulseWidthBlock from './PulseWidthBlock';
import RepeatBlock from './RepeatBlock';
import { applyDpiOverrides, applyFullColor, clearMinPower } from './sideEffects';
import SpeedBlock from './SpeedBlock';
import UVLightConfigs from './UVConfigs/UVLightConfigs';
import UVPrintingConfigs from './UVConfigs/UVPrintingConfigs';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

interface Props {
  UIType?: 'default' | 'modal' | 'panel-item';
}

// TODO: add test
const ConfigPanel = ({ UIType = 'default' }: Props): React.JSX.Element => {
  const selectedLayers = useLayerStore((state) => state.selectedLayers);
  const lang = useI18n().beambox.right_panel.laser_panel;
  const workarea = useWorkarea();
  const addOnInfo = useMemo(() => getAddOnInfo(workarea), [workarea]);
  const [modalMoveLayerDest, setModalMoveLayerDest] = useState(selectedLayers[0]);
  const useMaterialBrowser = useIsMaterialBrowserActive();
  const { getState } = useConfigPanelStore();
  const supportedModules = useSupportedModules(workarea);
  const state = getState();
  const watt = useCanvasStore((s) => s.watt);

  // fhx2rf presets depend on the machine watt, which is set in Document Settings
  useEffect(() => {
    if (workarea !== 'fhx2rf') return;

    postPresetChange();
    initState();
  }, [workarea, watt]);

  const { module } = state;
  const { isLaser, isPrinting, isUV } = useMemo(() => {
    return {
      isLaser: laserModules.has(module.value),
      isPrinting: printingModules.has(module.value),
      isUV: UVModules.has(module.value),
    };
  }, [module.value]);
  const isPromark = useMemo(() => promarkModels.has(workarea), [workarea]);

  useEffect(() => {
    if (UIType === 'modal' && selectedLayers.length > 1) {
      const currentLayerName = layerManager.getCurrentLayerName();

      layerManager.setSelectedLayers([currentLayerName]);
    }
  }, [selectedLayers, UIType]);

  useEffect(() => {
    const canvasEvents = eventEmitterFactory.createEventEmitter('canvas');

    if (module.value !== undefined) {
      canvasEvents.emit('select-module-changed', module.value);
    }
  }, [module.value, workarea]);

  useEffect(() => {
    if (!isPromark) {
      return () => {};
    }

    const canvasEvents = eventEmitterFactory.createEventEmitter('canvas');
    const updatePromarkInfo = piped(postPresetChange, () => initState());

    canvasEvents.on('promark-info-changed', updatePromarkInfo);

    return () => {
      canvasEvents.off('promark-info-changed', updatePromarkInfo);
    };
  }, [isPromark]);

  useEffect(() => {
    postPresetChange();
    presprayArea.togglePresprayArea();
    initState();
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [workarea, initState]);

  useEffect(() => {
    initState(selectedLayers);
    setModalMoveLayerDest(selectedLayers[0]);
  }, [selectedLayers]);

  useEffect(() => {
    if (useMaterialBrowser) {
      // First-activation migration + postPresetChange override, before any
      // workarea-change event can fire in new mode
      initMaterialBrowser();
    }
  }, [useMaterialBrowser]);

  const presetControl = useMaterialBrowser ? <MaterialChip UIType={UIType} /> : <PresetDropdown UIType={UIType} />;

  const displayName = selectedLayers.length === 1 ? selectedLayers[0] : lang.multi_layer;

  const commonContent = (
    <>
      {(isPrinting || isUV) && <HalftoneBlock type={UIType} />}
      {isLaser && <PowerBlock type={UIType} />}
      {(isPrinting || isUV) && <InkBlock type={UIType} />}
      <SpeedBlock type={UIType} />
      {isLaser && <DpiBlock type={UIType} />}
      {isPromark && <DottingTimeBlock type={UIType} />}
      {isPromark && <FillIntervalBlock type={UIType} />}
      {workarea === 'fhx2rf' && <HighQualityBlock type={UIType} />}
      {(isPrinting || isUV) && <MultipassBlock type={UIType} />}
      {addOnInfo.airAssist && isLaser && <AirAssistBlock type={UIType} />}
      {isPromark && <PulseWidthBlock type={UIType} />}
      {isPromark && <FrequencyBlock type={UIType} />}
      <RepeatBlock type={UIType} />
      {isPromark && <AdvancedSettingButton type={UIType} />}
      {isUV && <UVPrintingConfigs type={UIType} />}
      {workarea === 'fuv1' && <UVLightConfigs type={UIType} />}
    </>
  );

  const getContent = () => {
    if (UIType === 'default') {
      return (
        <div className={styles['config-panel']} id="laser-panel">
          <div className={classNames(styles.layername, 'hidden-mobile')}>
            {sprintf(lang.preset_setting, displayName)}
          </div>
          <ModuleBlock />
          {module.value !== LayerModule.UV_PRINT && (
            <>
              <div className={styles.container} id="layer-parameters">
                <div>
                  <ParameterTitle />
                  {presetControl}
                </div>
                {commonContent}
              </div>
              <AdvancedBlock type={UIType} />
              <DevBlock type={UIType} />
            </>
          )}
        </div>
      );
    }

    if (UIType === 'panel-item') {
      return (
        <>
          {supportedModules.length > 1 && (
            <div className={styles['item-group']}>
              <ModuleBlock />
              <ObjectPanelItem.Divider />
            </div>
          )}
          {module.value !== LayerModule.UV_PRINT && (
            <div className={styles['item-group']}>
              {presetControl}
              {commonContent}
            </div>
          )}
        </>
      );
    }

    const onClose = () => {
      dialogCaller.popDialogById('config-panel');
      ObjectPanelController.updateActiveKey(null);
    };
    const onSave = (): void => {
      const saveDataAndClose = () => {
        const batchCmd = new history.BatchCommand('Change layer parameter');
        const current = getState();
        // blocks defer layer writes when type is 'modal', so persist every key that differs from the layer
        const keys = (Object.keys(current) as ConfigKey[]).filter((key) => !objectConfig.includes(key));
        let fullColorToggled = false;

        selectedLayers.forEach((layerName: string) => {
          const layer = layerManager.getLayerElementByName(layerName)!;
          // untouched keys with differing per-layer values keep them; any edit clears hasMultiValue
          const changedKeys = keys.filter(
            (key) => !current[key].hasMultiValue && getData(layer, key, true) !== current[key].value,
          );

          // side effects the blocks apply while editing, replayed here for the deferred writes:
          // dpi & fullcolor first, so the writes below (the user's own edits) win over them
          if (changedKeys.includes('dpi')) {
            applyDpiOverrides(layer, getData(layer, 'dpi')!, current.dpi.value, workarea, batchCmd);
          }

          if (changedKeys.includes('fullcolor')) {
            applyFullColor(layer, current.fullcolor.value, batchCmd);
            fullColorToggled = true;
          }

          changedKeys.forEach((key) => {
            // fullcolor is written by applyFullColor, writing it again only adds a no-op undo step
            if (key === 'fullcolor') return;

            writeDataLayer(layer, key, current[key].value as any, { applyPrinting: true, batchCmd });
          });

          if (changedKeys.includes('power')) clearMinPower(layer, current.power.value, batchCmd);
        });

        if (fullColorToggled) layerManager.resync();

        batchCmd.onAfter = initState;
        svgCanvas.addCommandToHistory(batchCmd);
        onClose();
      };

      if (modalMoveLayerDest !== selectedLayers[0]) {
        moveToOtherLayer(modalMoveLayerDest, saveDataAndClose);
      } else {
        saveDataAndClose();
      }
    };
    const layerOptions = [];
    const allLayers = layerManager.getAllLayers();

    for (let i = allLayers.length - 1; i >= 0; i -= 1) {
      const layer = allLayers[i];
      const layerElement = layer.getGroup();
      const layerName = layer.getName();
      const layerModule = getData(layerElement, 'module') as LayerModuleType;
      const isFullColor = getData(layerElement, 'fullcolor')!;
      const color = getData(layerElement, 'color') ?? '#333333';

      layerOptions.push(
        <Select.Option key={layerName} label={layerName} value={layerName}>
          <div className={styles.option}>
            <ColorBlock color={isFullColor ? 'fullcolor' : color} size="mini" />
            {printingModules.has(layerModule) ? <LayerPanelIcons.Print /> : <LayerPanelIcons.Laser />}
            <span>{layerName}</span>
          </div>
        </Select.Option>,
      );
    }

    return (
      <ConfigProvider theme={{ components: { Button: { borderRadius: 100, controlHeight: 30 } } }}>
        <Modal
          cancelText={i18n.lang.beambox.tool_panels.cancel}
          centered
          className={styles.modal}
          okText={i18n.lang.beambox.tool_panels.confirm}
          onCancel={onClose}
          onOk={onSave}
          open
          title={lang.preset_setting.slice(0, -4)}
        >
          {modalMoveLayerDest && (
            <div className={styles['change-layer']}>
              <span className={styles.title}>{i18n.lang.beambox.right_panel.layer_panel.current_layer}:</span>
              <Select className={styles.select} defaultValue={modalMoveLayerDest} disabled>
                {layerOptions}
              </Select>
            </div>
          )}
          {allLayers.length > 1 && (
            <div className={styles['change-layer']}>
              <span className={styles.title}>{i18n.lang.beambox.right_panel.layer_panel.move_elems_to}</span>
              <Select
                className={styles.select}
                onChange={(layerName) => setModalMoveLayerDest(layerName)}
                popupMatchSelectWidth={false}
                value={modalMoveLayerDest}
              >
                {layerOptions}
              </Select>
            </div>
          )}
          {module.value !== LayerModule.UV_PRINT && (
            <>
              <div className={styles.params}>
                {presetControl}
                {commonContent}
              </div>
              <AdvancedBlock type={UIType} />
              <DevBlock type={UIType} />
            </>
          )}
        </Modal>
      </ConfigProvider>
    );
  };

  return getContent();
};

export default memo(ConfigPanel);
