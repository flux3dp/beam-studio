import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { QuestionCircleOutlined, SettingFilled, WarningOutlined } from '@ant-design/icons';
import { Checkbox, Switch, Tooltip, Segmented } from 'antd';
import classNames from 'classnames';
import { useShallow } from 'zustand/shallow';

import alertCaller from '@core/app/actions/alert-caller';
import constant, { modelsWithModules, promarkModels } from '@core/app/actions/beambox/constant';
import presprayArea from '@core/app/actions/canvas/prespray-area';
import rotaryAxis from '@core/app/actions/canvas/rotary-axis';
import { showRotarySettings } from '@core/app/components/dialogs/RotarySettings';
import { getAddOnInfo, RotaryType } from '@core/app/constants/addOn';
import alertConstants from '@core/app/constants/alert-constants';
import { CanvasMode } from '@core/app/constants/canvasMode';
import { fullColorHeadModules, LayerModule, printingModules } from '@core/app/constants/layer-module/layer-modules';
import { LaserType, workareaOptions as pmWorkareaOptions } from '@core/app/constants/promark-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { useStorageStore } from '@core/app/stores/storageStore';
import changeWorkarea from '@core/app/svgedit/operations/changeWorkarea';
import Select from '@core/app/widgets/AntdSelect';
import DraggableModal from '@core/app/widgets/DraggableModal';
import { getAutoFeeder, getPassThrough } from '@core/helpers/addOn';
import { checkFpm1, checkHxRf } from '@core/helpers/checkFeature';
import { getPromarkInfo, setPromarkInfo } from '@core/helpers/device/promark/promark-info';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import useHasCurveEngraving from '@core/helpers/hooks/useHasCurveEngraving';
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
import { showModuleSettings4C, showPassthroughSettings } from './utils';
import { Segment } from 'paper/dist/paper-core';
import { add } from 'remeda';

const workareaOptions = [
  { label: 'beamo', value: 'fbm1' },
  { label: 'Beambox', value: 'fbb1b' },
  { label: 'Beambox Pro', value: 'fbb1p' },
  { label: 'HEXA', value: 'fhexa1' },
  // use HEXA RF 3 as default, due to there is no difference between 3 and 6
  checkHxRf() && { label: 'HEXA RF', value: 'fhx2rf4' },
  { label: 'Ador', value: 'ado1' },
  checkFpm1() && { label: 'Promark', value: 'fpm1' },
  { label: 'Beambox II', value: 'fbb2' },
  { label: 'beamo II', value: 'fbm2' },
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

const dpiOptions = ['low', 'medium', 'high', 'ultra'] as const;

interface Props {
  unmount: () => void;
}

const topBarEventEmitter = eventEmitterFactory.createEventEmitter('top-bar');

const DocumentSettings = ({ unmount }: Props): React.JSX.Element => {
  const {
    beambox: { document_panel: tDocument },
    device: tDevice,
    global: tGlobal,
  } = useI18n();
  const [engraveDpi, setEngraveDpi] = useState(useDocumentStore.getState().engrave_dpi);
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

  const isInch = useStorageStore((state) => state.isInch);
  const { autoFeederHeight, autoFeederScale, chunkDiameter, passThroughHeight, rotaryScale } = useDocumentStore(
    useShallow((state) => ({
      autoFeederHeight: state['auto-feeder-height'],
      autoFeederScale: state['auto-feeder-scale'],
      chunkDiameter: state['rotary-chuck-obj-d'],
      passThroughHeight: state['pass-through-height'],
      rotaryScale: state['rotary-scale'],
    })),
  );

  const workareaObj = useMemo(() => getWorkarea(workarea), [workarea]);
  const hasCurveEngravingData = useHasCurveEngraving();
  const isCurveEngraving = useMemo(() => {
    const response = { mode: CanvasMode.Draw };

    topBarEventEmitter.emit('GET_CANVAS_MODE', response);

    return hasCurveEngravingData || response.mode === CanvasMode.CurveEngraving;
  }, [hasCurveEngravingData]);

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
  useEffect(() => {
    if (engraveDpi === 'low') setAutoShrink(false);
  }, [engraveDpi]);

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
      'enable-4c': enable4C,
      'enable-1064': enable1064,
      'enable-autofocus': Boolean(addOnInfo.autoFocus && enableAutofocus),
      'enable-diode': Boolean(addOnInfo.hybridLaser && enableDiode),
      engrave_dpi: engraveDpi,
    };

    if (addOnInfo.openBottom) newState.borderless = false;

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
    newState['rotary-type'] = rotaryType;

    if (rotaryMode && addOnInfo.openBottom) {
      newState.borderless = borderless;
    }

    const newPassThrough = Boolean(showPassThrough && passThrough);
    const passThroughChanged = newPassThrough !== origPassThrough;
    const newAutoFeeder = Boolean(showAutoFeeder && autoFeeder);
    const autoFeederChanged = newAutoFeeder !== origAutoFeeder;

    newState['pass-through'] = newPassThrough;

    if (showPassThrough && newPassThrough) {
      if (!origState['pass-through-height'] || origState['pass-through-height'] < minHeight) {
        newState['pass-through-height'] = minHeight;
      }
      if (addOnInfo.openBottom) newState['borderless'] = true;
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
  };

  const renderWarningIcon = (title: string) => (
    <Tooltip title={title}>
      <WarningOutlined className={styles.hint} />
    </Tooltip>
  );

  const renderPassThroughBlock = (isBold = false) => {
    if (!showPassThrough && showAutoFeeder) return null;

    return (
      <>
        <div className={styles.padBox}>
          <div className={styles.cardHr} />
          <div className={classNames(styles.padBoxInner, styles.row, styles.full)}>
            <label className={styles.title} htmlFor="passthroughMaster">
              {isBold ? <strong>Passthrough</strong> : <div>Passthrough</div>}
            </label>
            <div className={classNames(styles.control, styles['justify-start'])}>
              <Switch
                id="passthroughMaster"
                checked={autoFeeder || passThrough}
                disabled={isCurveEngraving || rotaryMode}
                onChange={(on: boolean) => {
                  if (on) {
                    if (showPassThrough) {
                      setPassThrough(true);
                      setAutoFeeder(false);
                    } else if (showAutoFeeder) {
                      setAutoFeeder(true);
                      setPassThrough(false);
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
            <>
              <div className={styles.cardHr} />
              <div className={styles.segWrap}>
                <Segmented
                  id="ptMode"
                  value={autoFeeder ? 'auto' : 'manual'}
                  onChange={(val) => {
                    if (val === 'auto') {
                      setAutoFeeder(true);
                      setPassThrough(false);
                    } else {
                      setPassThrough(true);
                      setAutoFeeder(false);
                    }
                  }}
                  options={[
                    ...(showAutoFeeder ? [{ label: tDocument.auto_feeder, value: 'auto' as const }] : []),
                    ...(showPassThrough ? [{ label: tDocument.manual, value: 'manual' as const }] : []),
                  ]}
                />
              </div>
              <div className={classNames(styles.segUnder, autoFeeder ? styles.posLeft : styles.posRight)}>
                <div className={styles.segUnderInner}>
                  <div className={styles.segmentDesc}>
                    {autoFeeder
                      ? `Y: ${lengthDisplay(Math.min(Math.max(autoFeederHeight ?? minHeight, minHeight), addOnInfo.autoFeeder!.maxHeight))}, Scale: ${autoFeederScale}`
                      : `Y: ${lengthDisplay(Math.max(passThroughHeight ?? minHeight, minHeight))}`}
                  </div>
                  <SettingFilled
                    className={styles.segmentGear}
                    onClick={() =>
                      autoFeeder
                        ? showPassthroughSettings({ workarea })
                        : showPassthroughSettings({ isManualMode: true, workarea })
                    }
                  />
                </div>
              </div>
            </>
          )}
        </div>
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
                {tDocument.workarea}:
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
                {tDocument.laser_source}:
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
          <div className={styles.row}>
            <label className={styles.title} htmlFor="dpi">
              {tDocument.engrave_dpi}
            </label>
            <Select
              className={styles.control}
              id="dpi"
              onChange={setEngraveDpi}
              options={dpiOptions.map((value) => ({
                label: `${tDocument[value]} (${constant.dpiValueMap[value]} DPI)`,
                value,
              }))}
              value={engraveDpi}
              variant="outlined"
            />
          </div>
          {!isPromark && (
            <div className={styles.row}>
              <label className={styles.title} htmlFor="autoShrink">
                {tDocument.auto_shrink}
              </label>
              <div className={classNames(styles.control, styles['justify-start'])}>
                <Switch checked={autoShrink} disabled={engraveDpi === 'low'} id="autoShrink" onChange={setAutoShrink} />
              </div>
            </div>
          )}
        </div>
        {addOnInfo.jobOrigin && (
          <>
            <div className={styles.separator}>
              <div>{tDocument.start_position}</div>
              <div className={styles.bar} />
            </div>
            <div className={styles.block}>
              <div className={styles.row}>
                <label className={styles.title} htmlFor="startFrom">
                  {tDocument.start_from}
                </label>
                <Select
                  className={styles.control}
                  id="startFrom"
                  onChange={setEnableJobOrigin}
                  options={
                    [
                      { label: tDocument.origin, value: false },
                      { label: tDocument.current_position, value: true },
                    ] as any
                  }
                  value={enableJobOrigin}
                  variant="outlined"
                />
              </div>
              {enableJobOrigin && (
                <div className={styles.row}>
                  <label className={styles.title}>{tDocument.job_origin}:</label>
                  <div className={styles.control}>
                    <div className={styles.radioGroup}>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((val) => (
                        <input
                          checked={jobOrigin === val}
                          id={`jobOrigin-${val}`}
                          key={val}
                          name="jobOrigin"
                          onChange={() => setJobOrigin(val)}
                          type="radio"
                        />
                      ))}
                    </div>
                    <div className={styles['job-origin-example']}>
                      <img alt="Origin" src="core-img/document-panel/job-origin-example.jpg" />
                      <div
                        className={classNames(styles.mark, {
                          [styles.b]: jobOrigin > 6,
                          [styles.c]: jobOrigin > 3 && jobOrigin <= 6,
                          [styles.l]: jobOrigin % 3 === 1,
                          [styles.m]: jobOrigin % 3 === 2,
                          [styles.r]: jobOrigin % 3 === 0,
                          [styles.t]: jobOrigin <= 3,
                        })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        {(isPromark || addOnInfo.autoFocus || addOnInfo.openBottom || addOnInfo.hybridLaser) && (
          <>
            <div className={styles.separator}>
              <div>{tDocument.add_on}</div>
              <div className={styles.bar} />
            </div>
            <div className={styles.modules}>
              {isPromark && (
                <>
                  <div className={classNames(styles.row, styles.full)}>
                    <div className={styles.title}>
                      <label htmlFor="start_button">{tDocument.start_work_button}</label>
                    </div>
                    <div className={styles.control}>
                      <Switch checked={enableStartButton} id="start_button" onChange={setEnableStartButton} />
                      {enableStartButton && (
                        <div className={styles.subCheckbox}>
                          <div>
                            <Checkbox
                              checked={shouldFrame}
                              id="frame_before_start"
                              onChange={(e) => setShouldFrame(e.target.checked)}
                            >
                              {tDocument.frame_before_start}
                            </Checkbox>
                            <QuestionCircleOutlined onClick={() => browser.open(tDocument.frame_before_start_url)} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.title}>
                      <label htmlFor="door_protect">{tDocument.door_protect}</label>
                    </div>
                    <div className={styles.control}>
                      <Tooltip title={tDocument.door_protect_desc}>
                        <QuestionCircleOutlined />
                      </Tooltip>
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
              <div className={styles.cardHr} />
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
            <div className={styles.separator}>
              <div>{'Add-ons'}</div>
              <div className={styles.bar} />
            </div>
            <div className={styles.modules}>
              {workareaObj.supportedModules?.includes(LayerModule.PRINTER_4C) && (
                <div className={styles.option}>
                  <div className={styles.main}>
                    <div className={styles.title}>
                      <label htmlFor="print_4c_module">{getModulesTranslations()[LayerModule.PRINTER]}</label>
                      <SettingFilled onClick={showModuleSettings4C} />
                    </div>
                    <div className={styles.control}>
                      <Switch checked={enable4C} id="print_4c_module" onChange={setEnable4C} />
                    </div>
                  </div>
                </div>
              )}
              {workareaObj.supportedModules?.includes(LayerModule.LASER_1064) && (
                <div className={styles.option}>
                  <div className={styles.main}>
                    <div className={styles.title}>
                      <label htmlFor="laser_1064_module">{getModulesTranslations()[LayerModule.LASER_1064]}</label>
                    </div>
                    <div className={styles.control}>
                      <Switch checked={enable1064} id="laser_1064_module" onChange={setEnable1064} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        {addOnInfo.rotary && (
          <>
            <div className={styles.padBox}>
              <div className={`${styles.padBoxInner} ${styles.row} ${styles.full}`}>
                <label className={styles.title} htmlFor="rotaryMaster">
                  <strong>Rotary</strong>
                </label>
                <div className={classNames(styles.control, styles['justify-start'])}>
                  <Switch
                    id="rotaryMaster"
                    checked={rotaryMode}
                    disabled={!addOnInfo.rotary || isCurveEngraving}
                    onChange={(on: boolean) => {
                      setRotaryMode(on);
                      if (!on) setBorderless(false);
                    }}
                  />
                </div>
              </div>

              {rotaryMode && (
                <>
                  <div className={styles.cardHr} />

                  <div className={styles.segWrap}>
                    <Segmented
                      id="rotaryModeSelect"
                      value={rotaryType}
                      onChange={(val) => setRotaryType(val as RotaryType)}
                      options={[
                        { label: 'Roller', value: RotaryType.Roller },
                        { label: 'Chuck', value: RotaryType.Chuck },
                      ]}
                    />
                  </div>

                  <div
                    className={classNames(
                      styles.segUnder,
                      rotaryType === RotaryType.Chuck ? styles.posRight : styles.posLeft,
                    )}
                  >
                    <div className={styles.segUnderInner}>
                      <div className={styles.segmentDesc}>
                        {rotaryType === RotaryType.Chuck
                          ? `Φ: ${lengthDisplay(chunkDiameter)}, Scale: ${rotaryScale}`
                          : `Scale: ${rotaryScale}`}
                      </div>
                      <SettingFilled
                        className={styles.segmentGear}
                        onClick={() =>
                          showRotarySettings({ rotaryMode, rotaryType, workarea }, () => {
                            setRotaryMode(useDocumentStore.getState().rotary_mode);
                            setRotaryType(useDocumentStore.getState()['rotary-type']);
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className={styles.cardHr} />
                  {addOnInfo.openBottom && (
                    <div className={`${styles.padBoxInner} ${styles.row} ${styles.full}`}>
                      <label className={styles.title} htmlFor="rotaryOpenBottom">
                        {tDocument.borderless_mode}
                      </label>
                      <div className={classNames(styles.control, styles['justify-start'])}>
                        <Switch id="rotaryOpenBottom" checked={borderless} onChange={setBorderless} />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            {isCurveEngraving && renderWarningIcon(tGlobal.mode_conflict)}
          </>
        )}

        {addOnInfo.openBottom ? (
          <div className={styles.padBox}>
            <div className={`${styles.padBoxInner} ${styles.row} ${styles.full}`}>
              <label className={styles.title} htmlFor="openBottomMaster">
                <strong>{tDocument.borderless_mode}</strong>
              </label>
              <div className={classNames(styles.control, styles['justify-start'])}>
                <Switch
                  id="openBottomMaster"
                  checked={borderless && !rotaryMode}
                  disabled={rotaryMode}
                  onChange={(v) => {
                    if (!rotaryMode) setBorderless(v);
                  }}
                />
              </div>
            </div>
            {!rotaryMode && borderless && renderPassThroughBlock(false)}
          </div>
        ) : (
          renderPassThroughBlock(true)
        )}
      </div>
    </DraggableModal>
  );
};

export default DocumentSettings;
