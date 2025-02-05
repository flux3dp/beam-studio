import React, { useEffect, useMemo, useState } from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Checkbox, Modal, Switch, Tooltip } from 'antd';
import classNames from 'classnames';

import alertCaller from '@core/app/actions/alert-caller';
import BeamboxPreference from '@core/app/actions/beambox/beambox-preference';
import constant, { promarkModels } from '@core/app/actions/beambox/constant';
import OpenBottomBoundaryDrawer from '@core/app/actions/beambox/open-bottom-boundary-drawer';
import diodeBoundaryDrawer from '@core/app/actions/canvas/diode-boundary-drawer';
import presprayArea from '@core/app/actions/canvas/prespray-area';
import rotaryAxis from '@core/app/actions/canvas/rotary-axis';
import { getSupportInfo } from '@core/app/constants/add-on';
import alertConstants from '@core/app/constants/alert-constants';
import LayerModule, { modelsWithModules } from '@core/app/constants/layer-module/layer-modules';
import { LaserType, workareaOptions as pmWorkareaOptions } from '@core/app/constants/promark-constants';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import changeWorkarea from '@core/app/svgedit/operations/changeWorkarea';
import Select from '@core/app/widgets/AntdSelect';
import UnitInput from '@core/app/widgets/UnitInput';
import { checkFbb2, checkFpm1 } from '@core/helpers/checkFeature';
import { getPromarkInfo, setPromarkInfo } from '@core/helpers/device/promark/promark-info';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import isDev from '@core/helpers/is-dev';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';
import storage from '@core/implementations/storage';
import type { PromarkInfo } from '@core/interfaces/Promark';

import styles from './DocumentSettings.module.scss';

const workareaOptions = [
  { label: 'beamo', value: 'fbm1' },
  { label: 'Beambox', value: 'fbb1b' },
  { label: 'Beambox Pro', value: 'fbb1p' },
  { label: 'HEXA', value: 'fhexa1' },
  { label: 'Ador', value: 'ado1' },
  checkFpm1() && { label: 'Promark', value: 'fpm1' },
  checkFbb2() && { label: 'Beambox II', value: 'fbb2' },
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

const DocumentSettings = ({ unmount }: Props): React.JSX.Element => {
  const {
    beambox: { document_panel: tDocu },
    global: tGlobal,
  } = useI18n();
  const [engraveDpi, setEngraveDpi] = useState(BeamboxPreference.read('engrave_dpi'));

  const origWorkarea = useMemo(() => BeamboxPreference.read('workarea'), []);
  const [pmInfo, setPmInfo] = useState(getPromarkInfo());
  const [workarea, setWorkarea] = useState<WorkAreaModel>(origWorkarea || 'fbb1b');
  const [customDimension, setCustomDimension] = useState<Record<WorkAreaModel, { height: number; width: number }>>(
    BeamboxPreference.read('customized-dimension') ?? {},
  );
  const supportInfo = useMemo(() => getSupportInfo(workarea), [workarea]);
  const isPromark = useMemo(() => promarkModels.has(workarea), [workarea]);
  const [rotaryMode, setRotaryMode] = useState<number>(BeamboxPreference.read('rotary_mode') ?? 0);
  const [enableStartButton, setEnableStartButton] = useState(!!BeamboxPreference.read('promark-start-button'));
  const [shouldFrame, setShouldFrame] = useState(!!BeamboxPreference.read('frame-before-start'));
  const [enableJobOrigin, setEnableJobOrigin] = useState<number>(BeamboxPreference.read('enable-job-origin') ?? 0);
  const [jobOrigin, setJobOrigin] = useState<number>(BeamboxPreference.read('job-origin') ?? 1);
  const [extendRotaryWorkarea, setExtendRotaryWorkarea] = useState<boolean>(
    !!BeamboxPreference.read('extend-rotary-workarea'),
  );
  const [mirrorRotary, setMirrorRotary] = useState<boolean>(!!BeamboxPreference.read('rotary-mirror'));
  const [borderless, setBorderless] = useState(!!BeamboxPreference.read('borderless'));
  const [enableDiode, setEnableDiode] = useState(!!BeamboxPreference.read('enable-diode'));
  const [enableAutofocus, setEnableAutofocus] = useState(!!BeamboxPreference.read('enable-autofocus'));
  const [passThrough, setPassThrough] = useState(!!BeamboxPreference.read('pass-through'));
  const [autoFeeder, setAutoFeeder] = useState(!!BeamboxPreference.read('auto-feeder'));

  const isInch = useMemo(() => storage.get('default-units') === 'inches', []);
  const workareaObj = useMemo(() => getWorkarea(workarea), [workarea]);
  const [passThroughHeight, setPassThroughHeight] = useState<number>(
    BeamboxPreference.read('pass-through-height') || workareaObj.displayHeight || workareaObj.height,
  );
  const [autoFeederHeight, setAutoFeederHeight] = useState<number>(
    BeamboxPreference.read('auto-feeder-height') || workareaObj.displayHeight || workareaObj.height,
  );

  // pass-through, autofeed, rotary mode are exclusive, disable others when one is on
  useEffect(() => {
    if (rotaryMode > 0) {
      setPassThrough(false);
      setAutoFeeder(false);
    }
  }, [rotaryMode]);
  useEffect(() => {
    if (passThrough) {
      setRotaryMode(0);
      setAutoFeeder(false);
    }
  }, [passThrough]);
  useEffect(() => {
    if (autoFeeder) {
      setRotaryMode(0);
      setPassThrough(false);
    }
  }, [autoFeeder]);
  // for openBottom machine, disable pass-through when borderless is off
  useEffect(() => {
    if (supportInfo.openBottom && !borderless) setPassThrough(false);
  }, [supportInfo, borderless]);

  const minHeight = useMemo(() => workareaObj.displayHeight ?? workareaObj.height, [workareaObj]);
  const showPassThrough = supportInfo.passThrough && (supportInfo.openBottom ? borderless : true);
  const handleRotaryModeChange: (on: boolean) => void = (on: boolean) => setRotaryMode(on ? 1 : 0);

  useEffect(() => {
    if (showPassThrough) setPassThroughHeight((cur) => Math.max(cur, minHeight));
  }, [minHeight, showPassThrough]);
  useEffect(() => {
    if (supportInfo.autoFeeder) {
      setAutoFeederHeight((cur) => Math.min(supportInfo.autoFeeder!.maxHeight, Math.max(minHeight, cur)));
    }
  }, [minHeight, supportInfo.autoFeeder]);

  const handleSave = () => {
    const dpiEvent = eventEmitterFactory.createEventEmitter('dpi-info');
    const workareaChanged = workarea !== origWorkarea;
    let customDimensionChanged = false;
    const rotaryChanged =
      rotaryMode !== BeamboxPreference.read('rotary_mode') ||
      extendRotaryWorkarea !== !!BeamboxPreference.read('extend-rotary-workarea');

    BeamboxPreference.write('engrave_dpi', engraveDpi);
    dpiEvent.emit('UPDATE_DPI', engraveDpi);
    BeamboxPreference.write('borderless', supportInfo.openBottom && borderless);
    BeamboxPreference.write('enable-diode', supportInfo.hybridLaser && enableDiode);
    BeamboxPreference.write('enable-autofocus', supportInfo.autoFocus && enableAutofocus);

    if (workareaObj.dismensionCustomizable) {
      const origVal = BeamboxPreference.read('customized-dimension') ?? {};

      customDimensionChanged =
        customDimension[workarea]?.width !== origVal[workarea]?.width ||
        customDimension[workarea]?.height !== origVal[workarea]?.height;
      BeamboxPreference.write('customized-dimension', {
        ...origVal,
        [workarea]: customDimension[workarea],
      });
    }

    BeamboxPreference.write('rotary_mode', rotaryMode);

    if (rotaryMode > 0) {
      if (supportInfo.rotary?.extendWorkarea) BeamboxPreference.write('extend-rotary-workarea', extendRotaryWorkarea);

      if (supportInfo.rotary?.mirror) BeamboxPreference.write('rotary-mirror', mirrorRotary);
    }

    const newPassThrough = showPassThrough && passThrough;
    const passThroughChanged = newPassThrough !== !!BeamboxPreference.read('pass-through');
    const passThroughHeightChanged = passThroughHeight !== BeamboxPreference.read('pass-through-height');
    const autoFeederChanged = autoFeeder !== !!BeamboxPreference.read('auto-feeder');
    const autoFeederHeightChanged = autoFeederHeight !== BeamboxPreference.read('auto-feeder-height');

    BeamboxPreference.write('pass-through', newPassThrough);

    if (showPassThrough) BeamboxPreference.write('pass-through-height', Math.max(passThroughHeight, minHeight));

    BeamboxPreference.write('auto-feeder', autoFeeder);

    if (supportInfo.autoFeeder) {
      const newVal = Math.min(supportInfo.autoFeeder.maxHeight, Math.max(minHeight, autoFeederHeight));

      BeamboxPreference.write('auto-feeder-height', newVal);
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
      // this is called in changeWorkarea
      OpenBottomBoundaryDrawer.update();

      if (supportInfo.hybridLaser && enableDiode) {
        diodeBoundaryDrawer.show();
      } else {
        diodeBoundaryDrawer.hide();
      }
    }

    if (promarkModels.has(workarea)) {
      setPromarkInfo(pmInfo);
      BeamboxPreference.write('promark-start-button', enableStartButton ? 1 : 0);
      BeamboxPreference.write('frame-before-start', shouldFrame ? 1 : 0);
    }

    presprayArea.togglePresprayArea();

    const canvasEvents = eventEmitterFactory.createEventEmitter('canvas');

    canvasEvents.emit('document-settings-saved');
  };

  return (
    <Modal
      cancelText={tGlobal.cancel}
      centered
      okText={tGlobal.save}
      onCancel={unmount}
      onOk={async () => {
        if (
          origWorkarea !== workarea &&
          modelsWithModules.has(origWorkarea) &&
          !modelsWithModules.has(workarea) &&
          document.querySelectorAll(`g.layer[data-module="${LayerModule.PRINTER}"]`).length
        ) {
          const res = await new Promise((resolve) => {
            alertCaller.popUp({
              buttonType: alertConstants.CONFIRM_CANCEL,
              id: 'save-document-settings',
              message: tDocu.notification.changeFromPrintingWorkareaTitle,
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
      title={tDocu.document_settings}
      width={440}
    >
      <div className={styles.container}>
        <div className={styles.block}>
          <div className={styles.row}>
            <label className={styles.title} htmlFor="workareaSelect">
              {tDocu.machine}:
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
          {workareaObj.dismensionCustomizable && (
            <div className={styles.row}>
              <label className={styles.title} htmlFor="customDimension">
                {tDocu.workarea}:
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
                {tDocu.laser_source}:
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
              {tDocu.engrave_dpi}:
            </label>
            <Select
              className={styles.control}
              id="dpi"
              onChange={setEngraveDpi}
              options={dpiOptions.map((value) => ({
                label: `${tDocu[value]} (${constant.dpiValueMap[value]} DPI)`,
                value,
              }))}
              value={engraveDpi}
              variant="outlined"
            />
          </div>
        </div>
        {supportInfo.jobOrigin && (
          <>
            <div className={styles.separator}>
              <div>{tDocu.start_position}</div>
              <div className={styles.bar} />
            </div>
            <div className={styles.block}>
              <div className={styles.row}>
                <label className={styles.title} htmlFor="startFrom">
                  {tDocu.start_from}:
                </label>
                <Select
                  className={styles.control}
                  id="startFrom"
                  onChange={setEnableJobOrigin}
                  options={[
                    { label: tDocu.origin, value: 0 },
                    { label: tDocu.current_position, value: 1 },
                  ]}
                  value={enableJobOrigin}
                  variant="outlined"
                />
              </div>
              {enableJobOrigin === 1 && (
                <div className={styles.row}>
                  <label className={styles.title}>{tDocu.job_origin}:</label>
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
          <div>{tDocu.add_on}</div>
          <div className={styles.bar} />
        </div>
        <div className={styles.modules}>
          {isPromark && (
            <div className={classNames(styles.row, styles.full)}>
              <div className={styles.title}>
                <label htmlFor="start_button">{tDocu.start_work_button}</label>
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
                        {tDocu.frame_before_start}
                      </Checkbox>
                      <QuestionCircleOutlined onClick={() => browser.open(tDocu.frame_before_start_url)} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {supportInfo.rotary && (
            <div
              className={classNames(styles.row, {
                [styles.full]: supportInfo.rotary.mirror || supportInfo.rotary.extendWorkarea,
              })}
            >
              <div className={styles.title}>
                <label htmlFor="rotary_mode">{tDocu.rotary_mode}</label>
              </div>
              <div className={styles.control}>
                <Switch
                  checked={rotaryMode > 0}
                  className={styles.switch}
                  disabled={!supportInfo.rotary}
                  id="rotary_mode"
                  onChange={handleRotaryModeChange}
                />
                {(supportInfo.rotary.mirror || supportInfo.rotary.extendWorkarea) && rotaryMode > 0 && (
                  <>
                    <div className={styles.subCheckbox}>
                      {supportInfo.rotary.extendWorkarea && (
                        <Checkbox
                          checked={extendRotaryWorkarea}
                          onChange={(e) => setExtendRotaryWorkarea(e.target.checked)}
                        >
                          {tDocu.extend_workarea}
                        </Checkbox>
                      )}
                      {supportInfo.rotary.mirror && (
                        <Checkbox checked={mirrorRotary} onChange={(e) => setMirrorRotary(e.target.checked)}>
                          {tDocu.mirror}
                        </Checkbox>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          {supportInfo.autoFocus && (
            <div className={styles.row}>
              <div className={styles.title}>
                <label htmlFor="autofocus-module">{tDocu.enable_autofocus}</label>
              </div>
              <div className={styles.control}>
                <Switch
                  checked={supportInfo.autoFocus && enableAutofocus}
                  className={styles.switch}
                  disabled={!supportInfo.autoFocus}
                  id="autofocus-module"
                  onChange={setEnableAutofocus}
                />
              </div>
            </div>
          )}
          {supportInfo.openBottom && (
            <div className={styles.row}>
              <div className={styles.title}>
                <label htmlFor="borderless_mode">{tDocu.borderless_mode}</label>
              </div>
              <div className={styles.control}>
                <Switch
                  checked={supportInfo.openBottom && borderless}
                  className={styles.switch}
                  disabled={!supportInfo.openBottom}
                  id="borderless_mode"
                  onChange={setBorderless}
                />
              </div>
            </div>
          )}
          {supportInfo.hybridLaser && (
            <div className={styles.row}>
              <div className={styles.title}>
                <label htmlFor="diode_module">{tDocu.enable_diode}</label>
              </div>
              <div className={styles.control}>
                <Switch
                  checked={supportInfo.hybridLaser && enableDiode}
                  className={styles.switch}
                  disabled={!supportInfo.hybridLaser}
                  id="diode_module"
                  onChange={setEnableDiode}
                />
              </div>
            </div>
          )}
          {showPassThrough && (
            <div className={classNames(styles.row, styles.full)}>
              <div className={styles.title}>
                <label htmlFor="pass_through">{tDocu.pass_through}</label>
              </div>
              <div className={styles.control}>
                <Switch
                  checked={supportInfo.passThrough && passThrough}
                  className={styles.switch}
                  disabled={!supportInfo.passThrough}
                  id="pass_through"
                  onChange={setPassThrough}
                />
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
                    <Tooltip title={tDocu.pass_through_height_desc}>
                      <QuestionCircleOutlined className={styles.hint} />
                    </Tooltip>
                  </>
                )}
              </div>
            </div>
          )}
          {Boolean(supportInfo.autoFeeder) && (
            <div className={classNames(styles.row, styles.full)}>
              <div className={styles.title}>
                <label htmlFor="auto_feeder">{tDocu.auto_feeder}</label>
              </div>
              <div className={styles.control}>
                <Switch
                  checked={supportInfo.autoFeeder && autoFeeder}
                  className={styles.switch}
                  disabled={!supportInfo.autoFeeder}
                  id="auto_feeder"
                  onChange={setAutoFeeder}
                />
                {autoFeeder && (
                  <UnitInput
                    addonAfter={isInch ? 'in' : 'mm'}
                    className={styles.input}
                    clipValue
                    id="auto_feeder_height"
                    isInch={isInch}
                    max={supportInfo.autoFeeder!.maxHeight}
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
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default DocumentSettings;
