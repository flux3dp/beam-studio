import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { QuestionCircleOutlined, SettingFilled, WarningOutlined } from '@ant-design/icons';
import { Checkbox, ConfigProvider, Segmented, Switch, Tooltip } from 'antd';
import classNames from 'classnames';
import { match } from 'ts-pattern';
import { useShallow } from 'zustand/shallow';

import alertCaller from '@core/app/actions/alert-caller';
import { modelsWithModules, promarkModels } from '@core/app/actions/beambox/constant';
import presprayArea from '@core/app/actions/canvas/prespray-area';
import rotaryAxis from '@core/app/actions/canvas/rotary-axis';
import { getAddOnInfo } from '@core/app/constants/addOn';
import alertConstants from '@core/app/constants/alert-constants';
import { CanvasMode } from '@core/app/constants/canvasMode';
import { fullColorHeadModules, LayerModule, printingModules } from '@core/app/constants/layer-module/layer-modules';
import { LaserType, workareaOptions as pmWorkareaOptions } from '@core/app/constants/promark-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import { useCurveEngravingStore } from '@core/app/stores/curveEngravingStore';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { useStorageStore } from '@core/app/stores/storageStore';
import changeWorkarea from '@core/app/svgedit/operations/changeWorkarea';
import Select from '@core/app/widgets/AntdSelect';
import DraggableModal from '@core/app/widgets/DraggableModal';
import { getAutoFeeder, getPassThrough } from '@core/helpers/addOn';
import { checkBM2, checkFpm1, checkHxRf } from '@core/helpers/checkFeature';
import { fhx2rfWatts, setHexa2RfWatt } from '@core/helpers/device/deviceStore';
import { getPromarkInfo, setPromarkInfo } from '@core/helpers/device/promark/promark-info';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import isDev from '@core/helpers/is-dev';
import { changeLayersModule } from '@core/helpers/layer-module/change-module';
import {
  getDefaultLaserModule,
  getLayersByModule,
  getModulesTranslations,
  hasModuleLayer,
} from '@core/helpers/layer-module/layer-module-helper';
import units from '@core/helpers/units';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';
import type { DocumentState } from '@core/interfaces/Preference';
import type { PromarkInfo } from '@core/interfaces/Promark';

import styles from './index.module.scss';
import JobOriginBlock from './JobOriginBlock';
import RotaryBlock from './RotaryBlock';
import { showModuleSettings4C, showPassthroughSettings } from './utils';

const workareaOptions = [
  { label: 'beamo', value: 'fbm1' },
  { label: 'Beambox', value: 'fbb1b' },
  { label: 'Beambox Pro', value: 'fbb1p' },
  { label: 'HEXA', value: 'fhexa1' },
  checkHxRf() && { label: 'HEXA RF', value: 'fhx2rf' },
  { label: 'Ador', value: 'ado1' },
  checkFpm1() && { label: 'Promark', value: 'fpm1' },
  { label: 'Beambox II', value: 'fbb2' },
  checkBM2() && { label: 'beamo II', value: 'fbm2' },
  isDev() && { label: 'Lazervida', value: 'flv1' },
].filter(Boolean);

const promarkLaserOptions = [
  { label: 'Desktop - 20W', value: `${LaserType.Desktop}-20` },
  { label: 'Desktop - 30W', value: `${LaserType.Desktop}-30` },
  { label: 'Desktop - 50W', value: `${LaserType.Desktop}-50` },
  { label: 'MOPA - 20W', value: `${LaserType.MOPA}-20` },
  { label: 'MOPA - 60W', value: `${LaserType.MOPA}-60` },
  { label: 'MOPA - 100W', value: `${LaserType.MOPA}-100` },
];

interface Props {
  unmount: () => void;
}

const DocumentSettings = ({ unmount }: Props): React.JSX.Element => {
  const {
    beambox: { document_panel: tDocument },
    device: tDevice,
    global: tGlobal,
  } = useI18n();
  const {
    autoFeeder: origAutoFeeder,
    passThrough: origPassThrough,
    workarea: origWorkarea,
  } = useMemo(() => {
    const workarea = useDocumentStore.getState().workarea;
    const addOnInfo = getAddOnInfo(workarea);
    const autoFeeder = getAutoFeeder(addOnInfo);
    const passThrough = getPassThrough(addOnInfo);

    return { autoFeeder, passThrough, workarea };
  }, []);
  const [pmInfo, setPmInfo] = useState(getPromarkInfo());
  const [workarea, setWorkarea] = useState(origWorkarea || 'fbb1b');
  const [customDimension, setCustomDimension] = useState(useDocumentStore.getState()['customized-dimension']);
  const addOnInfo = useMemo(() => getAddOnInfo(workarea), [workarea]);
  const isPromark = useMemo(() => promarkModels.has(workarea), [workarea]);
  const [rotaryMode, setRotaryMode] = useState(useDocumentStore.getState().rotary_mode);
  const [rotaryType, setRotaryType] = useState(useDocumentStore.getState()['rotary-type']);
  const [enableStartButton, setEnableStartButton] = useState(useDocumentStore.getState()['promark-start-button']);
  const [shouldFrame, setShouldFrame] = useState(useDocumentStore.getState()['frame-before-start']);
  const [enableJobOrigin, setEnableJobOrigin] = useState(useDocumentStore.getState()['enable-job-origin']);
  const [jobOrigin, setJobOrigin] = useState(useDocumentStore.getState()['job-origin']);
  const [borderless, setBorderless] = useState(!!useDocumentStore.getState().borderless);
  const [enableDiode, setEnableDiode] = useState(!!useDocumentStore.getState()['enable-diode']);
  const [enableAutofocus, setEnableAutofocus] = useState(!!useDocumentStore.getState()['enable-autofocus']);
  const [passThrough, setPassThrough] = useState(useDocumentStore.getState()['pass-through']);
  const [autoFeeder, setAutoFeeder] = useState(useDocumentStore.getState()['auto-feeder']);
  const [checkSafetyDoor, setCheckSafetyDoor] = useState(useDocumentStore.getState()['promark-safety-door']);
  const [autoShrink, setAutoShrink] = useState(useDocumentStore.getState()['auto_shrink']);
  const [enable4C, setEnable4C] = useState(!!useDocumentStore.getState()['enable-4c']);
  const [enable1064, setEnable1064] = useState(!!useDocumentStore.getState()['enable-1064']);
  const lastPassthroughMode = useRef<'auto' | 'manual' | null>(null);
  const workareaObj = useMemo(() => getWorkarea(workarea), [workarea]);
  const wattsOptions = useMemo(() => {
    return match(workarea)
      .with('fhx2rf', () => fhx2rfWatts.map((watt) => ({ label: `${watt}W`, value: watt })))
      .otherwise(() => null);
  }, [workarea]);
  const [watt, setWatt] = useState(useCanvasStore.getState().watt);
  const isInch = useStorageStore((state) => state.isInch);
  const {
    autoFeederHeight,
    autoFeederScale,
    passThroughHeight,
    rotaryMode: storeRotaryMode,
    rotaryType: storeRotaryType,
  } = useDocumentStore(
    useShallow((state) => ({
      autoFeederHeight: state['auto-feeder-height'],
      autoFeederScale: state['auto-feeder-scale'],
      passThroughHeight: state['pass-through-height'],
      rotaryMode: state.rotary_mode,
      rotaryType: state['rotary-type'],
    })),
  );

  const hasCurveEngravingData = useCurveEngravingStore((state) => state.hasData);
  const mode = useCanvasStore((state) => state.mode);
  const isCurveEngraving = useMemo(() => {
    if (!addOnInfo.curveEngraving) return false;

    return hasCurveEngravingData || mode === CanvasMode.CurveEngraving;
  }, [addOnInfo.curveEngraving, hasCurveEngravingData, mode]);

  // pass-through, auto-feeder, rotary mode are exclusive, disable others when one is on
  useEffect(() => {
    if (rotaryMode) {
      setPassThrough(false);
      setAutoFeeder(false);
    }
  }, [rotaryMode]);
  useEffect(() => {
    if (passThrough) {
      setRotaryMode(false);
      setAutoFeeder(false);
    }
  }, [passThrough]);
  useEffect(() => {
    if (autoFeeder) {
      setRotaryMode(false);
      setPassThrough(false);
    }
  }, [autoFeeder]);

  useEffect(() => setRotaryMode(storeRotaryMode), [storeRotaryMode]);
  useEffect(() => setRotaryType(storeRotaryType), [storeRotaryType]);

  // for openBottom machine, path-through and autofeed require open-bottom mode
  const { showAutoFeeder, showPassThrough } = useMemo(() => {
    const canUseBorderlessModules = addOnInfo.openBottom ? borderless : true;

    return {
      showAutoFeeder: addOnInfo.autoFeeder && canUseBorderlessModules,
      showPassThrough: addOnInfo.passThrough && canUseBorderlessModules,
    };
  }, [addOnInfo, borderless]);

  useEffect(() => {
    if (addOnInfo.openBottom && !borderless) {
      setPassThrough(false);
      setAutoFeeder(false);
    }
  }, [addOnInfo, borderless]);

  useEffect(() => {
    if (enable4C) setEnable1064(false);
  }, [enable4C]);

  useEffect(() => {
    if (enable1064) setEnable4C(false);
  }, [enable1064]);

  const minHeight = useMemo(() => workareaObj.displayHeight ?? workareaObj.height, [workareaObj]);

  const handleSave = async () => {
    const workareaChanged = workarea !== origWorkarea;
    let customDimensionChanged = false;
    const { update, ...origState } = useDocumentStore.getState();

    const rotaryChanged = rotaryMode !== origState.rotary_mode;

    const newState: Partial<DocumentState> = {
      borderless: Boolean(addOnInfo.openBottom && borderless),
      'enable-4c': enable4C,
      'enable-1064': enable1064,
      'enable-autofocus': Boolean(addOnInfo.autoFocus && enableAutofocus),
      'enable-diode': Boolean(addOnInfo.hybridLaser && enableDiode),
    };

    const defaultLaser = getDefaultLaserModule(workarea);

    if (origState['enable-4c'] && !enable4C) {
      const layers = getLayersByModule(fullColorHeadModules);

      if (layers.length > 0) {
        const res = await changeLayersModule(Array.from(layers), LayerModule.PRINTER_4C, defaultLaser);

        if (!res) {
          delete newState['enable-4c'];
          newState['enable-1064'] = false;
        }
      }
    }

    if (origState['enable-1064'] && !newState['enable-1064']) {
      const layers = getLayersByModule([LayerModule.LASER_1064]);

      if (layers.length > 0) {
        await changeLayersModule(Array.from(layers), LayerModule.LASER_1064, defaultLaser);
      }
    }

    if (workareaObj.dimensionCustomizable) {
      const origVal = origState['customized-dimension'];

      customDimensionChanged =
        customDimension[workarea]?.width !== origVal[workarea]?.width ||
        customDimension[workarea]?.height !== origVal[workarea]?.height;

      newState['customized-dimension'] = { ...origVal, [workarea]: customDimension[workarea] };
    }

    newState.rotary_mode = rotaryMode;

    if (addOnInfo.rotary?.chuck) newState['rotary-type'] = rotaryType;

    const newPassThrough = Boolean(showPassThrough && passThrough);
    const passThroughChanged = newPassThrough !== origPassThrough;
    const newAutoFeeder = Boolean(showAutoFeeder && autoFeeder);
    const autoFeederChanged = newAutoFeeder !== origAutoFeeder;

    newState['pass-through'] = newPassThrough;

    if (showPassThrough && newPassThrough) {
      if (!origState['pass-through-height'] || origState['pass-through-height'] < minHeight) {
        newState['pass-through-height'] = minHeight;
      }
    }

    newState['auto-feeder'] = newAutoFeeder;

    if (showAutoFeeder && newAutoFeeder) {
      if (!origState['auto-feeder-height'] || origState['auto-feeder-height'] < minHeight) {
        newState['auto-feeder-height'] = minHeight;
      } else if (origState['auto-feeder-height'] > addOnInfo.autoFeeder!.maxHeight) {
        newState['auto-feeder-height'] = addOnInfo.autoFeeder!.maxHeight;
      }
    }

    newState['enable-job-origin'] = enableJobOrigin;
    newState.auto_shrink = autoShrink;
    newState['job-origin'] = jobOrigin;

    if (promarkModels.has(workarea)) {
      setPromarkInfo(pmInfo);
      newState['promark-start-button'] = enableStartButton;
      newState['frame-before-start'] = shouldFrame;
      newState['promark-safety-door'] = checkSafetyDoor;
    }

    update(newState);

    if (workareaChanged || customDimensionChanged || rotaryChanged || passThroughChanged || autoFeederChanged) {
      changeWorkarea(workarea, { toggleModule: workareaChanged });

      if (workareaChanged) rotaryAxis.setPosition(workareaObj.pxHeight / 2, { write: true });

      rotaryAxis.toggleDisplay();
    }

    presprayArea.togglePresprayArea();

    const canvasEvents = eventEmitterFactory.createEventEmitter('canvas');

    canvasEvents.emit('document-settings-saved');

    if (wattsOptions) {
      useCanvasStore.setState({ watt });
      setHexa2RfWatt(undefined, watt);
    }
  };

  const renderWarningIcon = (title: string) => {
    if (!isCurveEngraving) return null;

    return (
      <Tooltip title={title}>
        <WarningOutlined className={styles.icon} />
      </Tooltip>
    );
  };

  const renderPassThroughBlock = (isBold = false) => {
    return (
      <>
        <div className={styles.row}>
          <label className={styles.title} htmlFor="passthroughMaster">
            {isBold ? <strong>{tDocument.pass_through}</strong> : <div>{tDocument.pass_through}</div>}
            {renderWarningIcon(tGlobal.mode_conflict)}
          </label>
          <div className={styles.control}>
            <Switch
              checked={autoFeeder || passThrough}
              disabled={isCurveEngraving}
              id="passthroughMaster"
              onChange={(on: boolean) => {
                if (on) {
                  if (lastPassthroughMode.current) {
                    if (lastPassthroughMode.current === 'auto' && showAutoFeeder) {
                      setAutoFeeder(true);
                      setPassThrough(false);

                      return;
                    }

                    if (lastPassthroughMode.current === 'manual' && showPassThrough) {
                      setPassThrough(true);
                      setAutoFeeder(false);

                      return;
                    }
                  }

                  if (showAutoFeeder) {
                    setAutoFeeder(true);
                    setPassThrough(false);
                  } else {
                    setPassThrough(true);
                    setAutoFeeder(false);
                  }
                } else {
                  setPassThrough(false);
                  setAutoFeeder(false);
                }
              }}
            />
          </div>
        </div>
        {(autoFeeder || passThrough) && (
          <div className={classNames(styles.row, styles.full)}>
            <Segmented
              className={styles.segmented}
              id="ptMode"
              onChange={(val) => {
                if (val === 'auto') {
                  setAutoFeeder(true);
                  setPassThrough(false);
                } else {
                  setPassThrough(true);
                  setAutoFeeder(false);
                }

                lastPassthroughMode.current = val as 'auto' | 'manual';
              }}
              options={[
                showAutoFeeder && { label: tDocument.auto_feeder, value: 'auto' as const },
                showPassThrough && { label: tDocument.manual, value: 'manual' as const },
              ].filter(Boolean)}
              value={autoFeeder ? 'auto' : 'manual'}
            />
            <div className={classNames(styles.sub)}>
              <div className={classNames(styles.desc, autoFeeder ? styles.left : styles.right)}>
                {autoFeeder
                  ? `Y: ${lengthDisplay(Math.min(Math.max(autoFeederHeight ?? minHeight, minHeight), addOnInfo.autoFeeder!.maxHeight))}, Scale: ${autoFeederScale}`
                  : `Y: ${lengthDisplay(Math.max(passThroughHeight ?? minHeight, minHeight))}`}
                <SettingFilled
                  className={styles.icon}
                  onClick={() =>
                    autoFeeder
                      ? showPassthroughSettings({ workarea })
                      : showPassthroughSettings({ isManualMode: true, workarea })
                  }
                />
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  const lengthDisplay = useCallback(
    (value: number) => {
      if (!isInch) return `${value} mm`;

      return `${units.convertUnit(value, 'inch', 'mm', 2)} in`;
    },
    [isInch],
  );

  return (
    <ConfigProvider
      theme={{
        components: {
          Modal: { contentBg: '#f8f8f8', headerBg: '#f8f8f8' },
          Segmented: { itemSelectedColor: '#1890ff' },
        },
      }}
    >
      <DraggableModal
        cancelText={tGlobal.cancel}
        okText={tGlobal.save}
        onCancel={unmount}
        onOk={async () => {
          if (
            origWorkarea !== workarea &&
            modelsWithModules.has(origWorkarea) &&
            !modelsWithModules.has(workarea) &&
            hasModuleLayer(Array.from(printingModules))
          ) {
            const res = await new Promise((resolve) => {
              alertCaller.popUp({
                buttonType: alertConstants.CONFIRM_CANCEL,
                id: 'save-document-settings',
                message: tDocument.notification.changeFromPrintingWorkareaTitle,
                messageIcon: 'notice',
                onCancel: () => resolve(false),
                onConfirm: () => resolve(true),
              });
            });

            if (!res) return;
          }

          handleSave();
          unmount();
        }}
        open
        scrollableContent
        title={tDocument.document_settings}
        width={440}
      >
        <div className={styles.container}>
          <div className={styles.block}>
            <div className={styles.row}>
              <label className={styles.title} htmlFor="workareaSelect">
                {tDocument.machine}
              </label>
              <Select
                className={styles.control}
                id="workareaSelect"
                onChange={setWorkarea}
                options={workareaOptions}
                value={workarea}
                variant="outlined"
              />
            </div>
            {workareaObj.dimensionCustomizable && (
              <div className={styles.row}>
                <label className={styles.title} htmlFor="customDimension">
                  {tDocument.workarea}
                </label>
                <Select
                  className={styles.control}
                  id="customDimension"
                  onChange={(val) => {
                    setCustomDimension((cur) => ({
                      ...cur,
                      [workarea]: { height: val, width: val },
                    }));
                  }}
                  options={pmWorkareaOptions.map((value) => ({ label: `${value} x ${value} mm`, value }))}
                  value={customDimension[workarea]?.width ?? workareaObj.width}
                  variant="outlined"
                />
              </div>
            )}
            {isPromark && (
              <div className={styles.row}>
                <label className={styles.title} htmlFor="pm-laser-source">
                  {tDocument.laser_source}
                </label>
                <Select
                  className={styles.control}
                  id="pm-laser-source"
                  onChange={(val) => {
                    const [type, watt] = val.split('-').map(Number);

                    setPmInfo({ laserType: type, watt } as PromarkInfo);
                  }}
                  options={promarkLaserOptions}
                  value={`${pmInfo.laserType}-${pmInfo.watt}`}
                  variant="outlined"
                />
              </div>
            )}
            {wattsOptions && (
              <div className={styles.row}>
                <label className={styles.title} htmlFor="laser-source">
                  {tDocument.laser_source}
                </label>
                <Select
                  className={styles.control}
                  id="laser-source"
                  onChange={(val) => setWatt(val)}
                  options={wattsOptions}
                  value={watt}
                  variant="outlined"
                />
              </div>
            )}
            {!isPromark && (
              <div className={styles.row}>
                <div className={styles.title}>
                  <label htmlFor="autoShrink">{tDocument.auto_shrink}</label>
                  <Tooltip title={tDocument.auto_shrink_tooltip}>
                    <QuestionCircleOutlined
                      className={styles.icon}
                      onClick={() => browser.open(tDocument.auto_shrink_url)}
                    />
                  </Tooltip>
                </div>
                <div className={styles.control}>
                  <Switch checked={autoShrink} id="autoShrink" onChange={setAutoShrink} />
                </div>
              </div>
            )}
          </div>
          {addOnInfo.jobOrigin && (
            <JobOriginBlock
              enableJobOrigin={enableJobOrigin}
              jobOrigin={jobOrigin}
              setEnableJobOrigin={setEnableJobOrigin}
              setJobOrigin={setJobOrigin}
            />
          )}
          {(isPromark || addOnInfo.autoFocus || addOnInfo.hybridLaser) && (
            <>
              <div className={styles.separator}>{tDocument.add_on}</div>
              <div className={styles.block}>
                {isPromark && (
                  <>
                    <div className={styles.row}>
                      <div className={styles.title}>
                        <label htmlFor="start_button">{tDocument.start_work_button}</label>
                        <QuestionCircleOutlined
                          className={styles.icon}
                          onClick={() => browser.open(tDocument.frame_before_start_url)}
                        />
                      </div>
                      <div className={styles.control}>
                        <Switch checked={enableStartButton} id="start_button" onChange={setEnableStartButton} />
                      </div>
                    </div>
                    {enableStartButton && (
                      <div className={styles.row}>
                        <Checkbox
                          checked={shouldFrame}
                          id="frame_before_start"
                          onChange={(e) => setShouldFrame(e.target.checked)}
                        >
                          {tDocument.frame_before_start}
                        </Checkbox>
                      </div>
                    )}
                    <div className={styles.row}>
                      <div className={styles.title}>
                        <label htmlFor="door_protect">{tDocument.door_protect}</label>
                        <Tooltip title={tDocument.door_protect_desc}>
                          <QuestionCircleOutlined className={styles.icon} />
                        </Tooltip>
                      </div>
                      <div className={styles.control}>
                        <Switch checked={checkSafetyDoor} id="door_protect" onChange={setCheckSafetyDoor} />
                      </div>
                    </div>
                  </>
                )}
                {addOnInfo.autoFocus && (
                  <div className={styles.row}>
                    <div className={styles.title}>
                      <label htmlFor="autofocus-module">{tDocument.enable_autofocus}</label>
                    </div>
                    <div className={styles.control}>
                      <Switch
                        checked={addOnInfo.autoFocus && enableAutofocus}
                        disabled={!addOnInfo.autoFocus}
                        id="autofocus-module"
                        onChange={setEnableAutofocus}
                      />
                    </div>
                  </div>
                )}
                {addOnInfo.hybridLaser && (
                  <div className={styles.row}>
                    <div className={styles.title}>
                      <label htmlFor="diode_module">{tDocument.enable_diode}</label>
                    </div>
                    <div className={styles.control}>
                      <Switch
                        checked={addOnInfo.hybridLaser && enableDiode}
                        disabled={!addOnInfo.hybridLaser}
                        id="diode_module"
                        onChange={setEnableDiode}
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          {addOnInfo.multiModules && (
            <>
              <div className={styles.separator}>{tDevice.submodule_type}</div>
              <div className={styles.block}>
                {workareaObj.supportedModules?.includes(LayerModule.PRINTER_4C) && (
                  <div className={styles.row}>
                    <div className={styles.title}>
                      <label htmlFor="print_4c_module">{getModulesTranslations()[LayerModule.PRINTER]}</label>
                      <SettingFilled className={styles.icon} onClick={showModuleSettings4C} />
                    </div>
                    <div className={styles.control}>
                      <Switch checked={enable4C} id="print_4c_module" onChange={setEnable4C} />
                    </div>
                  </div>
                )}
                {workareaObj.supportedModules?.includes(LayerModule.LASER_1064) && (
                  <div className={styles.row}>
                    <div className={styles.title}>
                      <label htmlFor="laser_1064_module">{getModulesTranslations()[LayerModule.LASER_1064]}</label>
                    </div>
                    <div className={styles.control}>
                      <Switch checked={enable1064} id="laser_1064_module" onChange={setEnable1064} />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          <RotaryBlock
            addOnInfo={addOnInfo}
            borderless={borderless}
            isCurveEngraving={isCurveEngraving}
            lengthDisplay={lengthDisplay}
            renderWarningIcon={renderWarningIcon}
            rotaryMode={rotaryMode}
            rotaryType={rotaryType}
            setBorderless={setBorderless}
            setRotaryMode={setRotaryMode}
            setRotaryType={setRotaryType}
            workarea={workarea}
          />
          {addOnInfo.openBottom ? (
            <div className={styles.block}>
              <div className={styles.row}>
                <label className={styles.title} htmlFor="openBottomMaster">
                  <strong>{tDocument.borderless_mode}</strong>
                </label>
                <div className={styles.control}>
                  <Switch
                    checked={borderless && !rotaryMode}
                    id="openBottomMaster"
                    onChange={(val) => {
                      if (val) setRotaryMode(false);

                      setBorderless(val);
                    }}
                  />
                </div>
              </div>
              {!rotaryMode && borderless && renderPassThroughBlock(false)}
            </div>
          ) : (
            (showPassThrough || showAutoFeeder) && <div className={styles.block}>{renderPassThroughBlock(true)}</div>
          )}
        </div>
      </DraggableModal>
    </ConfigProvider>
  );
};

export default DocumentSettings;
