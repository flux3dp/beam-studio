import React, { memo, useEffect, useMemo, useState } from 'react';

import { Button, ConfigProvider } from 'antd';
import classNames from 'classnames';
import { piped } from 'remeda';
import { sprintf } from 'sprintf-js';

import alertCaller from '@core/app/actions/alert-caller';
import { promarkModels } from '@core/app/actions/beambox/constant';
import presprayArea from '@core/app/actions/canvas/prespray-area';
import HighQualityBlock from '@core/app/components/beambox/RightPanel/ConfigPanel/HighQualityBlock';
import OpacityBlock from '@core/app/components/beambox/RightPanel/ConfigPanel/OpacityBlock';
import Divider from '@core/app/components/common/Divider';
import tutorialController from '@core/app/components/tutorials/tutorialController';
import { getAddOnInfo } from '@core/app/constants/addOn';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { laserModules, LayerModule, skippedModules, UVModules } from '@core/app/constants/layer-module/layer-modules';
import { printingModules } from '@core/app/constants/layer-module/layer-modules';
import tutorialConstants from '@core/app/constants/tutorial-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import LayerPanelIcons from '@core/app/icons/layer-panel/LayerPanelIcons';
import { useConfigPanelStore } from '@core/app/stores/configPanel';
import { useSelectedElementStore } from '@core/app/stores/element/selectedElementStore';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import useLayerStore from '@core/app/stores/layer/layerStore';
import history from '@core/app/svgedit/history/history';
import layerManager from '@core/app/svgedit/layer/layerManager';
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
import { moveToOtherLayer } from '@core/helpers/layer/layer-helper';
import { usePresetList } from '@core/helpers/presets/preset-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import useForceUpdate from '@core/helpers/use-force-update';
import useI18n from '@core/helpers/useI18n';
import type { CommonProps } from '@core/interfaces/ConfigOption';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import ColorBlock from '../ColorBlock';
import { PopupItem } from '../common/ObjectPanelItem';

import AdvancedBlock from './AdvancedBlock';
import AirAssistBlock from './AirAssistBlock';
import Backlash from './Backlash';
import styles from './ConfigPanel.module.scss';
import DottingTimeBlock from './DottingTimeBlock';
import DpiBlock from './DpiBlock';
import FillBlock from './FillBlock';
import HalftoneBlock from './HalftoneBlock';
import initState from './initState';
import InkBlock from './InkBlock';
import LaserDevOptions from './LaserDevOptions';
import MinPadding from './MinPadding';
import ModuleBlock from './ModuleBlock';
import MultipassBlock from './MultipassBlock';
import ParameterTitle from './ParameterTitle';
import PowerBlock from './PowerBlock';
import RepeatBlock from './RepeatBlock';
import SpeedBlock from './SpeedBlock';
import UVLightConfigs from './UVConfigs/UVLightConfigs';
import UVPrintingConfigs from './UVConfigs/UVPrintingConfigs';
import WhiteInkCheckbox from './WhiteInkCheckbox';

const PARAMETERS_CONSTANT = 'parameters';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const timeEstimationButtonEventEmitter = eventEmitterFactory.createEventEmitter('time-estimation-button');

interface Props {
  objectPanelKey?: string;
}

// TODO: add test
const ConfigPanel = ({ objectPanelKey }: Props): React.JSX.Element => {
  const selectedLayers = useLayerStore((state) => state.selectedLayers);
  const lang = useI18n().beambox.right_panel.laser_panel;
  const workarea = useWorkarea();
  const addOnInfo = useMemo(() => getAddOnInfo(workarea), [workarea]);
  const forceUpdate = useForceUpdate();
  const isDevMode = isDev();
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
  const state = getState();
  const { fullcolor, module } = state;
  const { isLaser, isPrinting, isUV } = useMemo(() => {
    return {
      isLaser: laserModules.has(module.value),
      isPrinting: printingModules.has(module.value),
      isUV: UVModules.has(module.value),
    };
  }, [module.value]);
  const isPromark = useMemo(() => promarkModels.has(workarea), [workarea]);
  const { noApply, UIType } = useMemo(
    () => ({ noApply: !!objectPanelKey, UIType: objectPanelKey ? 'modal' : 'default' }),
    [objectPanelKey],
  );

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

    canvasEvents.on('document-settings-saved', updatePromarkInfo);

    return () => {
      canvasEvents.off('document-settings-saved', updatePromarkInfo);
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

    if (!noApply) {
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

  const isCustomBacklashEnabled = useGlobalPreferenceStore((state) => state['enable-custom-backlash']);
  const dropdownOptions = presetList.map((e) => ({
    key: e.key || e.name,
    label: e.name,
    value: e.key || e.name,
  })) as Array<{ key: string; label: string; value: string }>;
  const displayName = selectedLayers.length === 1 ? selectedLayers[0] : lang.multi_layer;
  const commonProps: CommonProps = { noApply };

  const commonContent = (
    <>
      {(isPrinting || isUV) && <HalftoneBlock {...commonProps} />}
      {isLaser && <PowerBlock {...commonProps} />}
      {(isPrinting || isUV) && <InkBlock {...commonProps} />}
      <SpeedBlock {...commonProps} />
      {isLaser && <DpiBlock {...commonProps} />}
      {workarea === 'fhx2rf' && <HighQualityBlock {...commonProps} />}
      {(isPrinting || isUV) && <MultipassBlock {...commonProps} />}
      {isDevMode && isPrinting && fullcolor.value && UIType === 'default' && <WhiteInkCheckbox {...commonProps} />}
      {isDevMode && isCustomBacklashEnabled && <Backlash {...commonProps} />}
      {addOnInfo.airAssist && isLaser && <AirAssistBlock {...commonProps} />}
      <RepeatBlock {...commonProps} />
      {isPromark && <FillBlock />}
      {isPromark && <DottingTimeBlock {...commonProps} />}
      {isLaser && <LaserDevOptions {...commonProps} />}
      {isDevMode && <MinPadding {...commonProps} />}
      {isUV && <UVPrintingConfigs {...commonProps} />}
      {workarea === 'fuv1' && <UVLightConfigs {...commonProps} />}
    </>
  );

  if (UIType === 'default') {
    return (
      <div className={styles['config-panel']} id="laser-panel">
        <div className={classNames(styles.layername, 'hidden-mobile')}>{sprintf(lang.preset_setting, displayName)}</div>
        <ModuleBlock />
        {!skippedModules.has(module.value) && (
          <>
            <div className={styles.container} id="layer-parameters">
              <div>
                <ParameterTitle />
                <div className={styles['preset-dropdown-container']}>
                  <Select
                    className={styles['preset-dropdown']}
                    id="laser-config-dropdown"
                    onChange={handleSelectPresets}
                    options={[...hiddenOptions.filter((option) => option.value === dropdownValue), ...dropdownOptions]}
                    placement="bottomRight"
                    popupMatchSelectWidth={false}
                    value={dropdownValue}
                  />
                </div>
              </div>
              {commonContent}
            </div>
            <AdvancedBlock {...commonProps} />
          </>
        )}
        {module.value === LayerModule.GUIDE && (
          <div className={styles.container} id="layer-parameters">
            <div>
              <ParameterTitle noPreset />
            </div>
            <OpacityBlock {...commonProps} />
          </div>
        )}
      </div>
    );
  }

  const onClose = () => {
    useSelectedElementStore.setState({ activeKey: null });
  };
  const onSave = (): void => {
    // TODO: fix onSave and onChange with all configs!!!
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
        writeData(layerName, 'highQuality', state.highQuality.value, { batchCmd });
      });
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

  const content = (
    <div className={styles.modal}>
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
      {!skippedModules.has(module.value) && (
        <>
          <div className={styles.params}>
            <Divider />
            <div>
              <span className={styles.title}>{i18n.lang.beambox.right_panel.laser_panel.parameters}:</span>
              <ConfigProvider theme={{ components: { Select: { borderRadius: 100, controlHeight: 30 } } }}>
                <Select
                  className={styles.select}
                  id="laser-config-dropdown"
                  onChange={handleSelectPresets}
                  options={[...dropdownOptions, ...hiddenOptions.filter((option) => option.value === dropdownValue)]}
                  value={dropdownValue}
                />
              </ConfigProvider>
            </div>
            {commonContent}
            <Divider />
          </div>
          <AdvancedBlock {...commonProps} />
        </>
      )}
      {module.value === LayerModule.GUIDE && (
        <div className={styles.params}>
          <Divider />
          <OpacityBlock {...commonProps} />
        </div>
      )}
    </div>
  );

  return (
    <PopupItem
      footer={
        <div className={styles.footer}>
          <Button onClick={onClose}>{i18n.lang.beambox.tool_panels.cancel}</Button>
          <Button onClick={onSave} type="primary">
            {i18n.lang.beambox.tool_panels.confirm}
          </Button>
        </div>
      }
      id={objectPanelKey!}
      renderContent={() => content}
      title={i18n.lang.beambox.right_panel.laser_panel.parameters}
    />
  );
};

export default memo(ConfigPanel);

export const ConfigPanelPopup = ({ objectPanelKey }: Required<Props>) => {
  const activeKey = useSelectedElementStore((state) => state.activeKey);
  const isActive = activeKey === objectPanelKey;

  return isActive ? <ConfigPanel objectPanelKey={objectPanelKey} /> : null;
};
