import React, { memo, useEffect, useMemo, useState } from 'react';

import { ConfigProvider, Modal } from 'antd';
import classNames from 'classnames';
import { piped } from 'remeda';
import { sprintf } from 'sprintf-js';

import alertCaller from '@core/app/actions/alert-caller';
import { promarkModels } from '@core/app/actions/beambox/constant';
import presprayArea from '@core/app/actions/canvas/prespray-area';
import dialogCaller from '@core/app/actions/dialog-caller';
import HighQualityBlock from '@core/app/components/beambox/RightPanel/ConfigPanel/HighQualityBlock';
import tutorialController from '@core/app/components/tutorials/tutorialController';
import { getAddOnInfo } from '@core/app/constants/addOn';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { laserModules, LayerModule, UVModules } from '@core/app/constants/layer-module/layer-modules';
import { printingModules } from '@core/app/constants/layer-module/layer-modules';
import tutorialConstants from '@core/app/constants/tutorial-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import LayerPanelIcons from '@core/app/icons/layer-panel/LayerPanelIcons';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import { useConfigPanelStore } from '@core/app/stores/configPanel';
import useLayerStore from '@core/app/stores/layer/layerStore';
import history from '@core/app/svgedit/history/history';
import layerManager from '@core/app/svgedit/layer/layerManager';
import Select from '@core/app/widgets/AntdSelect';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import { useSupportedModules } from '@core/helpers/hooks/useSupportedModules';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import i18n from '@core/helpers/i18n';
import { useInnerEngravingActive } from '@core/helpers/innerEngraving';
import {
  applyPreset,
  CUSTOM_PRESET_CONSTANT,
  forcedKeys,
  getConfigKeys,
  getData,
  getDefaultConfig,
  objectConfig,
  postPresetChange,
  writeDataLayer,
} from '@core/helpers/layer/layer-config-helper';
import { moveToOtherLayer } from '@core/helpers/layer/layer-helper';
import { usePresetList } from '@core/helpers/presets/preset-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import useForceUpdate from '@core/helpers/use-force-update';
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
import ModuleBlock from './ModuleBlock';
import MultipassBlock from './MultipassBlock';
import ParameterTitle from './ParameterTitle';
import PowerBlock from './PowerBlock';
import PulseWidthBlock from './PulseWidthBlock';
import QPulseWidthBlock from './QPulseWidthBlock';
import RepeatBlock from './RepeatBlock';
import { applyDpiOverrides, applyFullColor, clearMinPower } from './sideEffects';
import SpeedBlock from './SpeedBlock';
import UVLightConfigs from './UVConfigs/UVLightConfigs';
import UVPrintingConfigs from './UVConfigs/UVPrintingConfigs';

const PARAMETERS_CONSTANT = 'parameters';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const timeEstimationButtonEventEmitter = eventEmitterFactory.createEventEmitter('time-estimation-button');

interface Props {
  UIType?: 'default' | 'modal' | 'panel-item';
}

// TODO: add test
const ConfigPanel = ({ UIType = 'default' }: Props): React.JSX.Element => {
  const selectedLayers = useLayerStore((state) => state.selectedLayers);
  const lang = useI18n().beambox.right_panel.laser_panel;
  const workarea = useWorkarea();
  const addOnInfo = useMemo(() => getAddOnInfo(workarea), [workarea]);
  const forceUpdate = useForceUpdate();
  const [modalMoveLayerDest, setModalMoveLayerDest] = useState(selectedLayers[0]);
  const hiddenOptions = useMemo(
    () => [
      { key: lang.dropdown.parameters, label: lang.dropdown.parameters, value: PARAMETERS_CONSTANT },
      { key: lang.custom_preset, label: lang.custom_preset, value: lang.custom_preset },
      { key: lang.various_preset, label: lang.various_preset, value: lang.various_preset },
    ],
    [lang.dropdown.parameters, lang.custom_preset, lang.various_preset],
  );
  const { change, getState } = useConfigPanelStore();
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
  const isInnerEngraving = useInnerEngravingActive();

  useEffect(() => {
    if (UIType === 'modal' && selectedLayers.length > 1) {
      const currentLayerName = layerManager.getCurrentLayerName();

      useLayerStore.getState().setSelectedLayers([currentLayerName]);
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

  const presetList = usePresetList(workarea, module.value);
  const dropdownValue = useMemo(() => {
    const { configName: name, diode, ink, multipass, power, repeat, speed, zStep } = state;
    const hasMultiValueList = [speed, power, ink, repeat, diode, zStep, name, multipass];

    // multi select
    if (hasMultiValueList.some((item) => item.hasMultiValue)) {
      return lang.various_preset;
    }

    if (name.value === CUSTOM_PRESET_CONSTANT) {
      return lang.custom_preset;
    }

    const preset = presetList?.find((p) => name.value === p.key || name.value === p.name);

    if (!preset) {
      return lang.custom_preset;
    }

    if (name.value) {
      return preset.key ?? preset.name;
    }

    return PARAMETERS_CONSTANT;
  }, [state, lang, presetList]);

  const handleSelectPresets = (value: string) => {
    if (value === PARAMETERS_CONSTANT) {
      forceUpdate();

      return;
    }

    const preset = presetList.find((p) => value === p.key || value === p.name);

    if (!preset) {
      console.error('No such value', value);

      return;
    }

    const changedKeys = getConfigKeys(module.value);
    const defaultConfig = getDefaultConfig();
    const payload: Record<string, boolean | number | string> = {};

    payload.configName = value;

    const { maxSpeed, minSpeed } = getWorkarea(workarea);
    const { dpiOverrides, ...base } = preset;
    const dpi = state.dpi.value;
    const resolvedPreset = { ...base, ...dpiOverrides?.[dpi] };

    for (const key of changedKeys) {
      let val = resolvedPreset[key];

      if (val === undefined) {
        if (!forcedKeys.includes(key)) continue;

        val = defaultConfig[key];
      }

      if (key === 'speed') {
        val = Math.max(minSpeed, Math.min(val as number, maxSpeed));
      }

      payload[key] = val! as any;
    }

    timeEstimationButtonEventEmitter.emit('SET_ESTIMATED_TIME', null);
    change(payload);

    if (UIType !== 'modal') {
      const batchCmd = new history.BatchCommand('Change layer preset');

      selectedLayers.forEach((layerName: string) => {
        const layer = layerManager.getLayerElementByName(layerName)!;

        applyPreset(layer, preset, { batchCmd });
      });
      batchCmd.onAfter = initState;
      svgCanvas.addCommandToHistory(batchCmd);
    }

    const { isDefault, key } = preset;
    const { SET_PRESET_WOOD_CUTTING, SET_PRESET_WOOD_ENGRAVING } = tutorialConstants;

    if (SET_PRESET_WOOD_ENGRAVING === tutorialController.getNextStepRequirement()) {
      if (isDefault && key!.startsWith('wood_engraving')) {
        tutorialController.handleNextStep();
      } else {
        alertCaller.popUp({ message: i18n.lang.tutorial.newUser.please_select_wood_engraving });
      }
    } else if (SET_PRESET_WOOD_CUTTING === tutorialController.getNextStepRequirement()) {
      if (isDefault && /^wood_[\d]+mm_cutting/.test(key!)) {
        tutorialController.handleNextStep();
      } else {
        alertCaller.popUp({ message: i18n.lang.tutorial.newUser.please_select_wood_cutting });
      }
    }
  };

  const dropdownOptions = presetList.map((e) => ({
    key: e.key || e.name,
    label: e.name,
    value: e.key || e.name,
  })) as Array<{ key: string; label: string; value: string }>;
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
      {isPromark && <QPulseWidthBlock type={UIType} />}
      {isPromark && <FrequencyBlock type={UIType} />}
      {!isInnerEngraving && <RepeatBlock type={UIType} />}
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
                  <div className={styles['preset-dropdown-container']}>
                    <Select
                      className={styles['preset-dropdown']}
                      id="laser-config-dropdown"
                      onChange={handleSelectPresets}
                      options={[
                        ...hiddenOptions.filter((option) => option.value === dropdownValue),
                        ...dropdownOptions,
                      ]}
                      placement="bottomRight"
                      popupMatchSelectWidth={false}
                      value={dropdownValue}
                    />
                  </div>
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
              <ObjectPanelItem.Select
                id="laser-config-dropdown"
                label={lang.presets}
                onChange={handleSelectPresets as any}
                options={[...dropdownOptions, ...hiddenOptions.filter((option) => option.value === dropdownValue)]}
                selected={
                  dropdownOptions.find((option) => option.value === dropdownValue) || {
                    label: dropdownValue!,
                    value: dropdownValue!,
                  }
                }
              />
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

        if (fullColorToggled) useLayerStore.getState().forceUpdate();

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
                <ConfigProvider theme={{ components: { Select: { borderRadius: 100, controlHeight: 30 } } }}>
                  <Select
                    className={styles.select}
                    id="laser-config-dropdown"
                    onChange={handleSelectPresets}
                    options={[...dropdownOptions, ...hiddenOptions.filter((option) => option.value === dropdownValue)]}
                    value={dropdownValue}
                  />
                </ConfigProvider>
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
