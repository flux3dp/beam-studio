import classNames from 'classnames';
import React, {
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';
import { ConfigProvider, Modal } from 'antd';
import { sprintf } from 'sprintf-js';

import alertCaller from 'app/actions/alert-caller';
import beamboxPreference from 'app/actions/beambox/beambox-preference';
import ColorBlock from 'app/components/beambox/right-panel/ColorBlock';
import dialogCaller from 'app/actions/dialog-caller';
import diodeBoundaryDrawer from 'app/actions/canvas/diode-boundary-drawer';
import eventEmitterFactory from 'helpers/eventEmitterFactory';
import history from 'app/svgedit/history/history';
import ISVGCanvas from 'interfaces/ISVGCanvas';
import i18n from 'helpers/i18n';
import isDev from 'helpers/is-dev';
import LayerModule, { modelsWithModules } from 'app/constants/layer-module/layer-modules';
import LayerPanelController from 'app/views/beambox/Right-Panels/contexts/LayerPanelController';
import LayerPanelIcons from 'app/icons/layer-panel/LayerPanelIcons';
import ObjectPanelController from 'app/views/beambox/Right-Panels/contexts/ObjectPanelController';
import ObjectPanelItem from 'app/views/beambox/Right-Panels/ObjectPanelItem';
import presetHelper from 'helpers/presets/preset-helper';
import presprayArea from 'app/actions/canvas/prespray-area';
import Select from 'app/widgets/AntdSelect';
import tutorialConstants from 'app/constants/tutorial-constants';
import tutorialController from 'app/views/tutorials/tutorialController';
import useForceUpdate from 'helpers/use-force-update';
import useI18n from 'helpers/useI18n';
import useWorkarea from 'helpers/hooks/useWorkarea';
import {
  applyPreset,
  CUSTOM_PRESET_CONSTANT,
  forcedKeys,
  getConfigKeys,
  getData,
  getDefaultConfig,
  getLayerConfig,
  getLayersConfig,
  postPresetChange,
  writeData,
} from 'helpers/layer/layer-config-helper';
import { getLayerElementByName, moveToOtherLayer } from 'helpers/layer/layer-helper';
import { getSupportInfo } from 'app/constants/add-on';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { getWorkarea } from 'app/constants/workarea-constants';
import { LayerPanelContext } from 'app/views/beambox/Right-Panels/contexts/LayerPanelContext';
import { promarkModels } from 'app/actions/beambox/constant';

import AdvancedBlock from './AdvancedBlock';
import Backlash from './Backlash';
import ConfigPanelContext, { getDefaultState, reducer } from './ConfigPanelContext';
import FillBlock from './FillBlock';
import HalftoneBlock from './HalftoneBlock';
import InkBlock from './InkBlock';
import ModuleBlock from './ModuleBlock';
import MultipassBlock from './MultipassBlock';
import ParameterTitle from './ParameterTitle';
import PowerBlock from './PowerBlock';
import RepeatBlock from './RepeatBlock';
import SpeedBlock from './SpeedBlock';
import styles from './ConfigPanel.module.scss';
import UVBlock from './UVBlock';
import WhiteInkCheckbox from './WhiteInkCheckbox';

const PARAMETERS_CONSTANT = 'parameters';

let svgCanvas: ISVGCanvas;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});
const timeEstimationButtonEventEmitter =
  eventEmitterFactory.createEventEmitter('time-estimation-button');

interface Props {
  UIType?: 'default' | 'panel-item' | 'modal';
}

// TODO: add test
const ConfigPanel = ({ UIType = 'default' }: Props): JSX.Element => {
  const { selectedLayers: initLayers } = useContext(LayerPanelContext);
  const [selectedLayers, setSelectedLayers] = useState(initLayers);
  const [state, dispatch] = useReducer(reducer, null, () => getDefaultState());
  useEffect(() => {
    const drawing = svgCanvas.getCurrentDrawing();
    const currentLayerName = drawing.getCurrentLayerName();
    if (UIType === 'modal') {
      setSelectedLayers([currentLayerName]);
    } else setSelectedLayers(initLayers);
    dispatch({ type: 'change', payload: { selectedLayer: currentLayerName } });
  }, [initLayers, UIType]);
  const forceUpdate = useForceUpdate();
  const lang = useI18n().beambox.right_panel.laser_panel;
  const hiddenOptions = useMemo(
    () => [
      {
        value: PARAMETERS_CONSTANT,
        key: lang.dropdown.parameters,
        label: lang.dropdown.parameters,
      },
      { value: lang.custom_preset, key: lang.custom_preset, label: lang.custom_preset },
      { value: lang.various_preset, key: lang.various_preset, label: lang.various_preset },
    ],
    [lang.dropdown.parameters, lang.custom_preset, lang.various_preset]
  );

  const workarea = useWorkarea();
  const isPromark = promarkModels.has(workarea);
  const updateDiodeBoundary = useCallback(() => {
    if (beamboxPreference.read('enable-diode') && getSupportInfo(workarea).hybridLaser)
      diodeBoundaryDrawer.show(state.diode.value === 1);
    else diodeBoundaryDrawer.hide();
  }, [state.diode.value, workarea]);

  useEffect(() => {
    updateDiodeBoundary();
  }, [updateDiodeBoundary]);

  const initState = useCallback((layers: string[] = LayerPanelController.getSelectedLayers()) => {
    if (layers.length > 1) {
      const drawing = svgCanvas.getCurrentDrawing();
      const currentLayerName = drawing.getCurrentLayerName();
      const config = getLayersConfig(layers, currentLayerName);
      dispatch({ type: 'update', payload: config });
    } else if (layers.length === 1) {
      const config = getLayerConfig(layers[0]);
      dispatch({ type: 'update', payload: config });
    }
  }, []);

  useEffect(() => {
    if (!isPromark) return () => {};
    const canvasEvents = eventEmitterFactory.createEventEmitter('canvas');
    const updatePromarkInfo = () => {
      postPresetChange();
      initState();
    };
    canvasEvents.on('document-settings-saved', updatePromarkInfo);
    return () => {
      canvasEvents.off('document-settings-saved', updatePromarkInfo);
    };
  }, [isPromark, initState]);

  useEffect(() => {
    postPresetChange();
    presprayArea.togglePresprayArea();
    initState();
    updateDiodeBoundary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workarea, initState]);

  useEffect(() => initState(selectedLayers), [initState, selectedLayers]);

  const presetList = presetHelper.getPresetsList(workarea, state.module.value);
  const dropdownValue = useMemo(() => {
    const { configName: name, speed, power, ink, repeat, zStep, diode, multipass } = state;
    // multi select
    if (
      speed.hasMultiValue ||
      power.hasMultiValue ||
      ink.hasMultiValue ||
      repeat.hasMultiValue ||
      diode.hasMultiValue ||
      zStep.hasMultiValue ||
      name.hasMultiValue ||
      multipass.hasMultiValue
    ) {
      return lang.various_preset;
    }
    if (name.value === CUSTOM_PRESET_CONSTANT) return lang.custom_preset;
    const preset = presetList?.find((p) => name.value === p.key || name.value === p.name);
    if (!preset) return lang.custom_preset;
    if (name.value) return preset.key ?? preset.name;
    return PARAMETERS_CONSTANT;
  }, [state, lang, presetList]);

  const { module, fullcolor } = state;
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
    const payload: { [key: string]: string | number | boolean } = {};
    payload.configName = value;
    const { maxSpeed, minSpeed } = getWorkarea(workarea);
    for (let i = 0; i < changedKeys.length; i += 1) {
      const key = changedKeys[i];
      let val = preset[key];
      if (val === undefined) {
        if (forcedKeys.includes(key)) val = defaultConfig[key];
        // eslint-disable-next-line no-continue
        else continue;
      }
      if (key === 'speed') val = Math.max(minSpeed, Math.min(val as number, maxSpeed));
      payload[key] = val;
    }
    timeEstimationButtonEventEmitter.emit('SET_ESTIMATED_TIME', null);
    dispatch({
      type: 'change',
      payload,
    });
    if (UIType !== 'modal') {
      const batchCmd = new history.BatchCommand('Change layer preset');
      selectedLayers.forEach((layerName: string) => {
        const layer = getLayerElementByName(layerName);
        applyPreset(layer, preset, { batchCmd });
      });
      batchCmd.onAfter = initState;
      svgCanvas.addCommandToHistory(batchCmd);
    }

    const { key, isDefault } = preset;
    const { SET_PRESET_WOOD_ENGRAVING, SET_PRESET_WOOD_CUTTING } = tutorialConstants;
    if (SET_PRESET_WOOD_ENGRAVING === tutorialController.getNextStepRequirement()) {
      if (isDefault && key.startsWith('wood_engraving')) tutorialController.handleNextStep();
      else alertCaller.popUp({ message: i18n.lang.tutorial.newUser.please_select_wood_engraving });
    } else if (SET_PRESET_WOOD_CUTTING === tutorialController.getNextStepRequirement()) {
      if (isDefault && /^wood_[\d]+mm_cutting/.test(key)) tutorialController.handleNextStep();
      else alertCaller.popUp({ message: i18n.lang.tutorial.newUser.please_select_wood_cutting });
    }
  };

  const isCustomBacklashEnabled = beamboxPreference.read('enable-custom-backlash');
  const dropdownOptions = presetList.map((e) => ({
    value: e.key || e.name,
    key: e.key || e.name,
    label: e.name,
  }));

  const displayName = selectedLayers.length === 1 ? selectedLayers[0] : lang.multi_layer;

  const isDevMode = isDev();
  const commonContent = (
    <>
      {isDevMode && module.value === LayerModule.PRINTER && UIType === 'default' && <UVBlock />}
      {module.value === LayerModule.PRINTER && <HalftoneBlock type={UIType} />}
      {module.value !== LayerModule.PRINTER && <PowerBlock type={UIType} />}
      {module.value === LayerModule.PRINTER && <InkBlock type={UIType} />}
      <SpeedBlock type={UIType} />
      {module.value === LayerModule.PRINTER && <MultipassBlock type={UIType} />}
      {isDevMode &&
        module.value === LayerModule.PRINTER &&
        fullcolor.value &&
        UIType === 'default' && <WhiteInkCheckbox />}
      {isDevMode && isCustomBacklashEnabled && <Backlash type={UIType} />}
      <RepeatBlock type={UIType} />
      {isDevMode &&
        module.value === LayerModule.PRINTER &&
        fullcolor.value &&
        UIType === 'panel-item' && <WhiteInkCheckbox type={UIType} />}
      {isPromark && <FillBlock type={UIType} />}
    </>
  );

  const getContent = () => {
    if (UIType === 'default') {
      return (
        <div id="laser-panel" className={styles['config-panel']}>
          <div className={classNames(styles.layername, 'hidden-mobile')}>
            {sprintf(lang.preset_setting, displayName)}
          </div>
          <ModuleBlock />
          <div id="layer-parameters" className={styles.container}>
            <div>
              <ParameterTitle />
              <div className={styles['preset-dropdown-container']}>
                <Select
                  id="laser-config-dropdown"
                  className={styles['preset-dropdown']}
                  value={dropdownValue}
                  onChange={handleSelectPresets}
                  options={[
                    ...hiddenOptions.filter((option) => option.value === dropdownValue),
                    ...dropdownOptions,
                  ]}
                  popupMatchSelectWidth={false}
                  placement="bottomRight"
                />
              </div>
            </div>
            {commonContent}
          </div>
          <AdvancedBlock type={UIType} />
        </div>
      );
    }
    if (UIType === 'panel-item') {
      return (
        <>
          {modelsWithModules.has(workarea) && (
            <div className={styles['item-group']}>
              <ModuleBlock />
              {isDevMode && module.value === LayerModule.PRINTER && <UVBlock />}
              <ObjectPanelItem.Divider />
            </div>
          )}
          <div className={styles['item-group']}>
            <ObjectPanelItem.Select
              id="laser-config-dropdown"
              selected={
                dropdownOptions.find((option) => option.value === dropdownValue) || {
                  value: dropdownValue,
                  label: dropdownValue,
                }
              }
              onChange={handleSelectPresets}
              options={[
                ...dropdownOptions,
                ...hiddenOptions.filter((option) => option.value === dropdownValue),
              ]}
              label={lang.presets}
            />
            {commonContent}
          </div>
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
          writeData(layerName, 'speed', state.speed.value, {
            applyPrinting: true,
            batchCmd,
          });
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
      const layerName = drawing.getLayerName(i);
      const layer = getLayerElementByName(layerName);
      const layerModule: LayerModule = getData(layer, 'module');
      const isFullColor = layer.getAttribute('data-fullcolor') === '1';
      layerOptions.push(
        <Select.Option key={layerName} value={layerName} label={layerName}>
          <div className={styles.option}>
            <ColorBlock
              size="mini"
              color={isFullColor ? 'fullcolor' : drawing.getLayerColor(layerName)}
            />
            {layerModule === LayerModule.PRINTER ? (
              <LayerPanelIcons.Print />
            ) : (
              <LayerPanelIcons.Laser />
            )}
            <span>{layerName}</span>
          </div>
        </Select.Option>
      );
    }
    return (
      <ConfigProvider
        theme={{
          components: { Button: { borderRadius: 100, controlHeight: 30 } },
        }}
      >
        <Modal
          className={styles.modal}
          title={lang.preset_setting.slice(0, -4)}
          onCancel={onClose}
          onOk={onSave}
          cancelText={i18n.lang.beambox.tool_panels.cancel}
          okText={i18n.lang.beambox.tool_panels.confirm}
          centered
          open
        >
          {selectedLayers.length > 0 && (
            <div className={styles['change-layer']}>
              <span className={styles.title}>
                {i18n.lang.beambox.right_panel.layer_panel.current_layer}:
              </span>
              <Select className={styles.select} defaultValue={selectedLayers[0]} disabled>
                {layerOptions}
              </Select>
            </div>
          )}
          {layerCount > 1 && (
            <div className={styles['change-layer']}>
              <span className={styles.title}>
                {i18n.lang.beambox.right_panel.layer_panel.move_elems_to}
              </span>
              <Select
                className={styles.select}
                popupMatchSelectWidth={false}
                value={selectedLayers[0]}
                onChange={(layerName) => setSelectedLayers([layerName])}
              >
                {layerOptions}
              </Select>
            </div>
          )}
          <div className={styles.params}>
            <ConfigProvider
              theme={{ components: { Select: { borderRadius: 100, controlHeight: 30 } } }}
            >
              <Select
                id="laser-config-dropdown"
                className={styles.select}
                value={dropdownValue}
                onChange={handleSelectPresets}
                options={[
                  ...dropdownOptions,
                  ...hiddenOptions.filter((option) => option.value === dropdownValue),
                ]}
              />
            </ConfigProvider>
            {commonContent}
          </div>
          <AdvancedBlock type={UIType} />
        </Modal>
      </ConfigProvider>
    );
  };

  return (
    <ConfigPanelContext.Provider
      value={{
        simpleMode: !beamboxPreference.read('print-advanced-mode'),
        state,
        dispatch,
        selectedLayers,
        initState,
      }}
    >
      {getContent()}
    </ConfigPanelContext.Provider>
  );
};

export default memo(ConfigPanel);
