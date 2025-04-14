import React, { memo, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { ConfigProvider, Modal } from 'antd';
import classNames from 'classnames';
import { piped } from 'remeda';
import { sprintf } from 'sprintf-js';

import alertCaller from '@core/app/actions/alert-caller';
import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import { modelsWithoutUvPrint, promarkModels } from '@core/app/actions/beambox/constant';
import diodeBoundaryDrawer from '@core/app/actions/canvas/diode-boundary-drawer';
import presprayArea from '@core/app/actions/canvas/prespray-area';
import dialogCaller from '@core/app/actions/dialog-caller';
import ColorBlock from '@core/app/components/beambox/right-panel/ColorBlock';
import { getAddOnInfo } from '@core/app/constants/addOn';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import { printingModules } from '@core/app/constants/layer-module/layer-modules';
import tutorialConstants from '@core/app/constants/tutorial-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import LayerPanelIcons from '@core/app/icons/layer-panel/LayerPanelIcons';
import { useConfigPanelStore } from '@core/app/stores/configPanel';
import history from '@core/app/svgedit/history/history';
import DottingTimeBlock from '@core/app/views/beambox/Right-Panels/ConfigPanel/DottingTimeBlock';
import { LayerPanelContext } from '@core/app/views/beambox/Right-Panels/contexts/LayerPanelContext';
import ObjectPanelController from '@core/app/views/beambox/Right-Panels/contexts/ObjectPanelController';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import tutorialController from '@core/app/views/tutorials/tutorialController';
import Select from '@core/app/widgets/AntdSelect';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import i18n from '@core/helpers/i18n';
import isDev from '@core/helpers/is-dev';
import {
  applyPreset,
  CUSTOM_PRESET_CONSTANT,
  forcedKeys,
  getConfigKeys,
  getData,
  getDefaultConfig,
  postPresetChange,
  writeData,
} from '@core/helpers/layer/layer-config-helper';
import { getLayerElementByName, moveToOtherLayer } from '@core/helpers/layer/layer-helper';
import presetHelper from '@core/helpers/presets/preset-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import useForceUpdate from '@core/helpers/use-force-update';
import useI18n from '@core/helpers/useI18n';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import AdvancedBlock from './AdvancedBlock';
import AdvancedPrintingBlock from './AdvancedPrintingBlock';
import Backlash from './Backlash';
import styles from './ConfigPanel.module.scss';
import ConfigPanelContext from './ConfigPanelContext';
import FillBlock from './FillBlock';
import HalftoneBlock from './HalftoneBlock';
import initState from './initState';
import InkBlock from './InkBlock';
import ModuleBlock from './ModuleBlock';
import MultipassBlock from './MultipassBlock';
import ParameterTitle from './ParameterTitle';
import PowerBlock from './PowerBlock';
import RepeatBlock from './RepeatBlock';
import SpeedBlock from './SpeedBlock';
import UVBlock from './UVBlock';
import WhiteInkCheckbox from './WhiteInkCheckbox';

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
  const { selectedLayers: initLayers } = useContext(LayerPanelContext);
  const lang = useI18n().beambox.right_panel.laser_panel;
  const workarea = useWorkarea();
  const forceUpdate = useForceUpdate();
  const isDevMode = isDev();
  const [selectedLayers, setSelectedLayers] = useState(initLayers);
  const hiddenOptions = useMemo(
    () => [
      { key: lang.dropdown.parameters, label: lang.dropdown.parameters, value: PARAMETERS_CONSTANT },
      { key: lang.custom_preset, label: lang.custom_preset, value: lang.custom_preset },
      { key: lang.various_preset, label: lang.various_preset, value: lang.various_preset },
    ],
    [lang.dropdown.parameters, lang.custom_preset, lang.various_preset],
  );
  const { change, getState } = useConfigPanelStore();
  const state = getState();
  const { diode, fullcolor, module } = state;
  const isPrintingModule = useMemo(() => printingModules.has(module.value), [module.value]);
  const isPromark = useMemo(() => promarkModels.has(workarea), [workarea]);

  const updateDiodeBoundary = useCallback(() => {
    if (beamboxPreference.read('enable-diode') && getAddOnInfo(workarea).hybridLaser) {
      diodeBoundaryDrawer.show(diode.value === 1);
    } else {
      diodeBoundaryDrawer.hide();
    }
  }, [diode.value, workarea]);

  useEffect(() => {
    updateDiodeBoundary();
  }, [updateDiodeBoundary]);

  useEffect(() => {
    const drawing = svgCanvas.getCurrentDrawing();
    const currentLayerName = drawing.getCurrentLayerName()!;

    if (UIType === 'modal') setSelectedLayers([currentLayerName]);
    else setSelectedLayers(initLayers);

    change({ selectedLayer: currentLayerName });
  }, [change, initLayers, UIType]);

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

    canvasEvents.on('document-settings-saved', updatePromarkInfo);

    return () => {
      canvasEvents.off('document-settings-saved', updatePromarkInfo);
    };
  }, [isPromark]);

  useEffect(() => {
    postPresetChange();
    presprayArea.togglePresprayArea();
    initState();
    updateDiodeBoundary();
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [workarea, initState]);

  useEffect(() => initState(selectedLayers), [selectedLayers]);

  const presetList = presetHelper.getPresetsList(workarea, module.value);
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

    for (const key of changedKeys) {
      let val = preset[key];

      if (val === undefined) {
        if (!forcedKeys.includes(key)) continue;

        val = defaultConfig[key];
      }

      if (key === 'speed') {
        val = Math.max(minSpeed, Math.min(val as number, maxSpeed));
      }

      payload[key] = val!;
    }

    timeEstimationButtonEventEmitter.emit('SET_ESTIMATED_TIME', null);
    change(payload);

    if (UIType !== 'modal') {
      const batchCmd = new history.BatchCommand('Change layer preset');

      selectedLayers.forEach((layerName: string) => {
        const layer = getLayerElementByName(layerName);

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

  const isCustomBacklashEnabled = beamboxPreference.read('enable-custom-backlash');
  const dropdownOptions = presetList.map((e) => ({
    key: e.key || e.name,
    label: e.name,
    value: e.key || e.name,
  })) as Array<{ key: string; label: string; value: string }>;
  const displayName = selectedLayers.length === 1 ? selectedLayers[0] : lang.multi_layer;

  const commonContent = (
    <>
      {isDevMode && isPrintingModule && UIType === 'default' && <UVBlock />}
      {isPrintingModule && <HalftoneBlock type={UIType} />}
      {!isPrintingModule && <PowerBlock type={UIType} />}
      {isPrintingModule && <InkBlock type={UIType} />}
      <SpeedBlock type={UIType} />
      {isPrintingModule && <MultipassBlock type={UIType} />}
      {isDevMode && isPrintingModule && fullcolor.value && UIType === 'default' && <WhiteInkCheckbox />}
      {isDevMode && isCustomBacklashEnabled && <Backlash type={UIType} />}
      <RepeatBlock type={UIType} />
      {isDevMode && isPrintingModule && fullcolor.value && UIType === 'panel-item' && (
        <WhiteInkCheckbox type={UIType} />
      )}
      {isPromark && <FillBlock type={UIType} />}
      {isPromark && <DottingTimeBlock type={UIType} />}
      {isDevMode && isPrintingModule && <AdvancedPrintingBlock />}
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
            </>
          )}
        </div>
      );
    }

    if (UIType === 'panel-item') {
      return (
        <>
          {!modelsWithoutUvPrint.has(workarea) && (
            <div className={styles['item-group']}>
              <ModuleBlock />
              {isDevMode && isPrintingModule && <UVBlock />}
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

    const drawing = svgCanvas.getCurrentDrawing();
    const layerCount = drawing.getNumLayers();
    const onClose = () => {
      dialogCaller.popDialogById('config-panel');
      ObjectPanelController.updateActiveKey(null);
    };
    const onSave = (): void => {
      const destLayer = selectedLayers[0];
      const saveDataAndClose = () => {
        const batchCmd = new history.BatchCommand('Change layer parameter');

        selectedLayers.forEach((layerName: string) => {
          writeData(layerName, 'speed', state.speed.value, { applyPrinting: true, batchCmd });
          writeData(layerName, 'power', state.power.value, { batchCmd });
          writeData(layerName, 'repeat', state.repeat.value, { batchCmd });
          writeData(layerName, 'zStep', state.zStep.value, { batchCmd });
          writeData(layerName, 'configName', state.configName.value, { batchCmd });
          writeData(layerName, 'ink', state.ink.value, { batchCmd });
          writeData(layerName, 'multipass', state.multipass.value, { batchCmd });
          writeData(layerName, 'halftone', state.halftone.value, { batchCmd });
        });
        batchCmd.onAfter = initState;
        svgCanvas.addCommandToHistory(batchCmd);
        onClose();
      };

      if (destLayer !== initLayers[0]) {
        moveToOtherLayer(destLayer, saveDataAndClose);
      } else {
        saveDataAndClose();
      }
    };
    const layerOptions = [];

    for (let i = layerCount - 1; i >= 0; i -= 1) {
      const layerName = drawing.getLayerName(i)!;
      const layer = getLayerElementByName(layerName);
      const layerModule: LayerModule = getData(layer, 'module') as LayerModule;
      const isFullColor = layer.getAttribute('data-fullcolor') === '1';

      layerOptions.push(
        <Select.Option key={layerName} label={layerName} value={layerName}>
          <div className={styles.option}>
            <ColorBlock color={isFullColor ? 'fullcolor' : drawing.getLayerColor(layerName)} size="mini" />
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
          {selectedLayers.length > 0 && (
            <div className={styles['change-layer']}>
              <span className={styles.title}>{i18n.lang.beambox.right_panel.layer_panel.current_layer}:</span>
              <Select className={styles.select} defaultValue={selectedLayers[0]} disabled>
                {layerOptions}
              </Select>
            </div>
          )}
          {layerCount > 1 && (
            <div className={styles['change-layer']}>
              <span className={styles.title}>{i18n.lang.beambox.right_panel.layer_panel.move_elems_to}</span>
              <Select
                className={styles.select}
                onChange={(layerName) => setSelectedLayers([layerName])}
                popupMatchSelectWidth={false}
                value={selectedLayers[0]}
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
            </>
          )}
        </Modal>
      </ConfigProvider>
    );
  };

  return (
    <ConfigPanelContext.Provider value={{ selectedLayers, simpleMode: !beamboxPreference.read('print-advanced-mode') }}>
      {getContent()}
    </ConfigPanelContext.Provider>
  );
};

export default memo(ConfigPanel);
