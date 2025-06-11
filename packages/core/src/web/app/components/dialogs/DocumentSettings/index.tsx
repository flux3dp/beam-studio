import React, { useEffect, useMemo, useState } from 'react';

import { QuestionCircleOutlined, SettingFilled, WarningOutlined } from '@ant-design/icons';
import { Checkbox, Switch, Tooltip } from 'antd';
import classNames from 'classnames';

import alertCaller from '@core/app/actions/alert-caller';
import BeamboxPreference from '@core/app/actions/beambox/beambox-preference';
import constant, { modelsWithModules, promarkModels } from '@core/app/actions/beambox/constant';
import diodeBoundaryDrawer from '@core/app/actions/canvas/diode-boundary-drawer';
import presprayArea from '@core/app/actions/canvas/prespray-area';
import rotaryAxis from '@core/app/actions/canvas/rotary-axis';
import { showRotarySettings } from '@core/app/components/dialogs/RotarySettings';
import { getAddOnInfo } from '@core/app/constants/addOn';
import alertConstants from '@core/app/constants/alert-constants';
import CanvasMode from '@core/app/constants/canvasMode';
import { printingModules } from '@core/app/constants/layer-module/layer-modules';
import { LaserType, workareaOptions as pmWorkareaOptions } from '@core/app/constants/promark-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import changeWorkarea from '@core/app/svgedit/operations/changeWorkarea';
import Select from '@core/app/widgets/AntdSelect';
import DraggableModal from '@core/app/widgets/DraggableModal';
import UnitInput from '@core/app/widgets/UnitInput';
import { getAutoFeeder, getPassThrough } from '@core/helpers/addOn';
import { checkFpm1, checkHxRf } from '@core/helpers/checkFeature';
import { getPromarkInfo, setPromarkInfo } from '@core/helpers/device/promark/promark-info';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import useHasCurveEngraving from '@core/helpers/hooks/useHasCurveEngraving';
import isDev from '@core/helpers/is-dev';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';
import storage from '@core/implementations/storage';
import type { PromarkInfo } from '@core/interfaces/Promark';

import AddOnSelect from './AddOnSelect';
import styles from './index.module.scss';

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
  isDev() && { label: 'beamo II', value: 'fbm2' },
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
    global: tGlobal,
  } = useI18n();
  const [engraveDpi, setEngraveDpi] = useState(BeamboxPreference.read('engrave_dpi'));
  const {
    autoFeeder: origAutoFeeder,
    passThrough: origPassThrough,
    workarea: origWorkarea,
  } = useMemo(() => {
    const workarea = BeamboxPreference.read('workarea');
    const addOnInfo = getAddOnInfo(workarea);
    const autoFeeder = getAutoFeeder(addOnInfo);
    const passThrough = getPassThrough(addOnInfo);

    return { autoFeeder, passThrough, workarea };
  }, []);
  const [pmInfo, setPmInfo] = useState(getPromarkInfo());
  const [workarea, setWorkarea] = useState(origWorkarea || 'fbb1b');
  const [customDimension, setCustomDimension] = useState(BeamboxPreference.read('customized-dimension'));
  const addOnInfo = useMemo(() => getAddOnInfo(workarea), [workarea]);
  const isPromark = useMemo(() => promarkModels.has(workarea), [workarea]);
  const [rotaryMode, setRotaryMode] = useState(BeamboxPreference.read('rotary_mode'));
  const [enableStartButton, setEnableStartButton] = useState(BeamboxPreference.read('promark-start-button'));
  const [shouldFrame, setShouldFrame] = useState(BeamboxPreference.read('frame-before-start'));
  const [enableJobOrigin, setEnableJobOrigin] = useState(BeamboxPreference.read('enable-job-origin'));
  const [jobOrigin, setJobOrigin] = useState(BeamboxPreference.read('job-origin'));
  const [borderless, setBorderless] = useState(!!BeamboxPreference.read('borderless'));
  const [enableDiode, setEnableDiode] = useState(!!BeamboxPreference.read('enable-diode'));
  const [enableAutofocus, setEnableAutofocus] = useState(!!BeamboxPreference.read('enable-autofocus'));
  const [passThrough, setPassThrough] = useState(BeamboxPreference.read('pass-through'));
  const [autoFeeder, setAutoFeeder] = useState(BeamboxPreference.read('auto-feeder'));
  const [autoFeederScale, setAutoFeederScale] = useState(BeamboxPreference.read('auto-feeder-scale'));
  const [checkSafetyDoor, setCheckSafetyDoor] = useState(BeamboxPreference.read('promark-safety-door'));

  const isInch = useMemo(() => storage.get('default-units') === 'inches', []);
  const workareaObj = useMemo(() => getWorkarea(workarea), [workarea]);
  const [passThroughHeight, setPassThroughHeight] = useState<number>(
    BeamboxPreference.read('pass-through-height') || workareaObj.displayHeight || workareaObj.height,
  );
  const [autoFeederHeight, setAutoFeederHeight] = useState<number>(
    BeamboxPreference.read('auto-feeder-height') || workareaObj.displayHeight || workareaObj.height,
  );
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

  const minHeight = useMemo(() => workareaObj.displayHeight ?? workareaObj.height, [workareaObj]);

  useEffect(() => {
    if (showPassThrough) setPassThroughHeight((cur) => Math.max(cur, minHeight));
  }, [minHeight, showPassThrough]);
  useEffect(() => {
    if (showAutoFeeder) {
      setAutoFeederHeight((cur) => Math.min(addOnInfo.autoFeeder!.maxHeight, Math.max(minHeight, cur)));
    }
  }, [minHeight, addOnInfo.autoFeeder, showAutoFeeder]);

  const handleSave = () => {
    const workareaChanged = workarea !== origWorkarea;
    let customDimensionChanged = false;
    const rotaryChanged = rotaryMode !== BeamboxPreference.read('rotary_mode');

    BeamboxPreference.write('engrave_dpi', engraveDpi);
    BeamboxPreference.write('borderless', Boolean(addOnInfo.openBottom && borderless));
    BeamboxPreference.write('enable-diode', addOnInfo.hybridLaser && enableDiode);
    BeamboxPreference.write('enable-autofocus', addOnInfo.autoFocus && enableAutofocus);

    if (workareaObj.dimensionCustomizable) {
      const origVal = BeamboxPreference.read('customized-dimension');

      customDimensionChanged =
        customDimension[workarea]?.width !== origVal[workarea]?.width ||
        customDimension[workarea]?.height !== origVal[workarea]?.height;

      BeamboxPreference.write('customized-dimension', { ...origVal, [workarea]: customDimension[workarea] });
    }

    BeamboxPreference.write('rotary_mode', rotaryMode);

    const newPassThrough = Boolean(showPassThrough && passThrough);
    const passThroughChanged = newPassThrough !== origPassThrough;
    const passThroughHeightChanged = passThroughHeight !== BeamboxPreference.read('pass-through-height');
    const newAutoFeeder = Boolean(showAutoFeeder && autoFeeder);
    const autoFeederChanged = newAutoFeeder !== origAutoFeeder;
    const autoFeederHeightChanged = autoFeederHeight !== BeamboxPreference.read('auto-feeder-height');

    BeamboxPreference.write('pass-through', newPassThrough);

    if (showPassThrough) BeamboxPreference.write('pass-through-height', Math.max(passThroughHeight, minHeight));

    BeamboxPreference.write('auto-feeder', newAutoFeeder);

    if (showAutoFeeder) {
      const newVal = Math.min(addOnInfo.autoFeeder!.maxHeight, Math.max(minHeight, autoFeederHeight));

      BeamboxPreference.write('auto-feeder-height', newVal);
      BeamboxPreference.write('auto-feeder-scale', autoFeederScale);
    }

    BeamboxPreference.write('enable-job-origin', enableJobOrigin);
    BeamboxPreference.write('job-origin', jobOrigin);

    if (
      workareaChanged ||
      customDimensionChanged ||
      rotaryChanged ||
      passThroughChanged ||
      passThroughHeightChanged ||
      autoFeederChanged ||
      autoFeederHeightChanged
    ) {
      changeWorkarea(workarea, { toggleModule: workareaChanged });
      rotaryAxis.toggleDisplay();
    } else {
      if (addOnInfo.hybridLaser && enableDiode) {
        diodeBoundaryDrawer.show();
      } else {
        diodeBoundaryDrawer.hide();
      }
    }

    if (promarkModels.has(workarea)) {
      setPromarkInfo(pmInfo);
      BeamboxPreference.write('promark-start-button', enableStartButton);
      BeamboxPreference.write('frame-before-start', shouldFrame);
      BeamboxPreference.write('promark-safety-door', checkSafetyDoor);
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

  return (
    <DraggableModal
      cancelText={tGlobal.cancel}
      centered
      okText={tGlobal.save}
      onCancel={unmount}
      onOk={async () => {
        if (
          origWorkarea !== workarea &&
          modelsWithModules.has(origWorkarea) &&
          !modelsWithModules.has(workarea) &&
          document.querySelectorAll(
            Array.from(printingModules)
              .map((module) => `g.layer[data-module="${module}"]`)
              .join(', '),
          ).length
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
      title={tDocument.document_settings}
      width={440}
    >
      <div className={styles.container}>
        <div className={styles.block}>
          <div className={styles.row}>
            <label className={styles.title} htmlFor="workareaSelect">
              {tDocument.machine}:
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
              {tDocument.engrave_dpi}:
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
                  {tDocument.start_from}:
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
                  <Switch
                    checked={enableStartButton}
                    className={styles.switch}
                    id="start_button"
                    onChange={setEnableStartButton}
                  />
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
                  <Switch
                    checked={checkSafetyDoor}
                    className={styles.switch}
                    id="door_protect"
                    onChange={setCheckSafetyDoor}
                  />
                  <Tooltip title={tDocument.door_protect_desc}>
                    <QuestionCircleOutlined />
                  </Tooltip>
                </div>
              </div>
            </>
          )}
          {addOnInfo.rotary && (
            <div className={classNames(styles.row, styles.full)}>
              <div className={styles.title}>
                <label htmlFor="rotary_mode">{tDocument.rotary_mode}</label>
              </div>
              <div className={styles.control}>
                <Switch
                  checked={rotaryMode}
                  className={styles.switch}
                  disabled={!addOnInfo.rotary || isCurveEngraving}
                  id="rotary_mode"
                  onChange={setRotaryMode}
                />
                <SettingFilled
                  onClick={() =>
                    showRotarySettings({ rotaryMode, workarea }, () => {
                      setRotaryMode(BeamboxPreference.read('rotary_mode'));
                    })
                  }
                />
                {isCurveEngraving && renderWarningIcon(tGlobal.mode_conflict)}
              </div>
            </div>
          )}
          {addOnInfo.autoFocus && (
            <div className={styles.row}>
              <div className={styles.title}>
                <label htmlFor="autofocus-module">{tDocument.enable_autofocus}</label>
              </div>
              <div className={styles.control}>
                <Switch
                  checked={addOnInfo.autoFocus && enableAutofocus}
                  className={styles.switch}
                  disabled={!addOnInfo.autoFocus}
                  id="autofocus-module"
                  onChange={setEnableAutofocus}
                />
              </div>
            </div>
          )}
          {addOnInfo.openBottom && (
            <div className={styles.row}>
              <div className={styles.title}>
                <label htmlFor="borderless_mode">{tDocument.borderless_mode}</label>
              </div>
              <div className={styles.control}>
                <Switch
                  checked={addOnInfo.openBottom && borderless}
                  className={styles.switch}
                  disabled={!addOnInfo.openBottom}
                  id="borderless_mode"
                  onChange={setBorderless}
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
                  className={styles.switch}
                  disabled={!addOnInfo.hybridLaser}
                  id="diode_module"
                  onChange={setEnableDiode}
                />
              </div>
            </div>
          )}
          {showPassThrough && (
            <div className={classNames(styles.row, styles.full)}>
              <div className={styles.title}>
                <label htmlFor="pass_through">{tDocument.pass_through}</label>
              </div>
              <div className={styles.control}>
                <Switch
                  checked={addOnInfo.passThrough && passThrough}
                  className={styles.switch}
                  disabled={!addOnInfo.passThrough || isCurveEngraving}
                  id="pass_through"
                  onChange={setPassThrough}
                />
                {isCurveEngraving && renderWarningIcon(tGlobal.mode_conflict)}
                {passThrough && (
                  <>
                    <UnitInput
                      addonAfter={isInch ? 'in' : 'mm'}
                      className={styles.input}
                      clipValue
                      id="pass_through_height"
                      isInch={isInch}
                      min={minHeight}
                      onChange={(val) => {
                        if (val) {
                          setPassThroughHeight(val);
                        }
                      }}
                      precision={isInch ? 2 : 0}
                      size="small"
                      value={passThroughHeight}
                    />
                    <Tooltip title={tDocument.pass_through_height_desc}>
                      <QuestionCircleOutlined className={styles.hint} />
                    </Tooltip>
                  </>
                )}
              </div>
            </div>
          )}
          {showAutoFeeder && (
            <>
              <div className={classNames(styles.row, styles.full)}>
                <div className={styles.title}>
                  <label htmlFor="auto_feeder">{tDocument.auto_feeder}</label>
                </div>
                <div className={styles.control}>
                  <Switch
                    checked={addOnInfo.autoFeeder && autoFeeder}
                    className={styles.switch}
                    disabled={!addOnInfo.autoFeeder || isCurveEngraving}
                    id="auto_feeder"
                    onChange={setAutoFeeder}
                  />
                  {isCurveEngraving && renderWarningIcon(tGlobal.mode_conflict)}
                  {autoFeeder && (
                    <UnitInput
                      addonAfter={isInch ? 'in' : 'mm'}
                      className={styles.input}
                      clipValue
                      id="auto_feeder_height"
                      isInch={isInch}
                      max={addOnInfo.autoFeeder!.maxHeight}
                      min={minHeight}
                      onChange={(val) => {
                        if (val) {
                          setAutoFeederHeight(val);
                        }
                      }}
                      precision={isInch ? 2 : 0}
                      size="small"
                      value={autoFeederHeight}
                    />
                  )}
                  <Tooltip title={tDocument.auto_feeder_url}>
                    <QuestionCircleOutlined
                      className={styles.hint}
                      onClick={() => browser.open(tDocument.auto_feeder_url)}
                    />
                  </Tooltip>
                </div>
              </div>
              {autoFeeder && (
                <AddOnSelect
                  id="auto_feeder_scale"
                  onChange={setAutoFeederScale}
                  title={tDocument.scale}
                  tooltip={tDocument.auto_feeder_scale}
                  value={autoFeederScale}
                />
              )}
            </>
          )}
        </div>
      </div>
    </DraggableModal>
  );
};

export default DocumentSettings;
