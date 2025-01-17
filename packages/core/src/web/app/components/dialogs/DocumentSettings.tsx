import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import { Checkbox, Modal, Switch, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

import alertCaller from 'app/actions/alert-caller';
import alertConstants from 'app/constants/alert-constants';
import BeamboxPreference from 'app/actions/beambox/beambox-preference';
import browser from 'implementations/browser';
import changeWorkarea from 'app/svgedit/operations/changeWorkarea';
import constant, { promarkModels } from 'app/actions/beambox/constant';
import diodeBoundaryDrawer from 'app/actions/canvas/diode-boundary-drawer';
import eventEmitterFactory from 'helpers/eventEmitterFactory';
import isDev from 'helpers/is-dev';
import LayerModule, { modelsWithModules } from 'app/constants/layer-module/layer-modules';
import localeHelper from 'helpers/locale-helper';
import OpenBottomBoundaryDrawer from 'app/actions/beambox/open-bottom-boundary-drawer';
import presprayArea from 'app/actions/canvas/prespray-area';
import rotaryAxis from 'app/actions/canvas/rotary-axis';
import Select from 'app/widgets/AntdSelect';
import storage from 'implementations/storage';
import UnitInput from 'app/widgets/UnitInput';
import useI18n from 'helpers/useI18n';
import { getPromarkInfo, setPromarkInfo } from 'helpers/device/promark/promark-info';
import { getSupportInfo } from 'app/constants/add-on';
import { LaserType, workareaOptions as pmWorkareaOptions } from 'app/constants/promark-constants';
import { WorkAreaModel, getWorkarea } from 'app/constants/workarea-constants';

import styles from './DocumentSettings.module.scss';

const workareaOptions = [
  { label: 'beamo', value: 'fbm1' },
  { label: 'Beambox', value: 'fbb1b' },
  { label: 'Beambox Pro', value: 'fbb1p' },
  { label: 'HEXA', value: 'fhexa1' },
  { label: 'Ador', value: 'ado1' },
  (localeHelper.isTwOrHk || isDev()) && { label: 'Promark', value: 'fpm1' },
  (localeHelper.isTwOrHk || localeHelper.isJp || isDev()) && { label: 'Beambox II', value: 'fbb2' },
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

const dpiOptions = ['low', 'medium', 'high', 'ultra'];

interface Props {
  unmount: () => void;
}

const DocumentSettings = ({ unmount }: Props): JSX.Element => {
  const {
    global: tGlobal,
    beambox: { document_panel: tDocu },
  } = useI18n();
  const [engraveDpi, setEngraveDpi] = useState(BeamboxPreference.read('engrave_dpi'));

  const origWorkarea = useMemo(() => BeamboxPreference.read('workarea'), []);
  const [pmInfo, setPmInfo] = useState(getPromarkInfo());
  const [workarea, setWorkarea] = useState<WorkAreaModel>(origWorkarea || 'fbb1b');
  const [customDimension, setCustomDimension] = useState<
    Record<WorkAreaModel, { width: number; height: number }>
  >(BeamboxPreference.read('customized-dimension') ?? {});
  const supportInfo = useMemo(() => getSupportInfo(workarea), [workarea]);
  const isPromark = useMemo(() => promarkModels.has(workarea), [workarea]);
  const [rotaryMode, setRotaryMode] = useState<number>(BeamboxPreference.read('rotary_mode') ?? 0);
  const [enableStartButton, setEnableStartButton] = useState(
    !!BeamboxPreference.read('promark-start-button')
  );
  const [shouldFrame, setShouldFrame] = useState(!!BeamboxPreference.read('frame-before-start'));
  const [enableJobOrigin, setEnableJobOrigin] = useState<number>(
    BeamboxPreference.read('enable-job-origin') ?? 0
  );
  const [jobOrigin, setJobOrigin] = useState<number>(BeamboxPreference.read('job-origin') ?? 1);
  const [extendRotaryWorkarea, setExtendRotaryWorkarea] = useState<boolean>(
    !!BeamboxPreference.read('extend-rotary-workarea')
  );
  const [mirrorRotary, setMirrorRotary] = useState<boolean>(
    !!BeamboxPreference.read('rotary-mirror')
  );
  const [borderless, setBorderless] = useState(!!BeamboxPreference.read('borderless'));
  const [enableDiode, setEnableDiode] = useState(!!BeamboxPreference.read('enable-diode'));
  const [enableAutofocus, setEnableAutofocus] = useState(
    !!BeamboxPreference.read('enable-autofocus')
  );
  const [passThrough, setPassThrough] = useState(!!BeamboxPreference.read('pass-through'));

  const isInch = useMemo(() => storage.get('default-units') === 'inches', []);
  const workareaObj = useMemo(() => getWorkarea(workarea), [workarea]);
  const [passThroughHeight, setPassThroughHeight] = useState<number>(
    BeamboxPreference.read('pass-through-height') || workareaObj.displayHeight || workareaObj.height
  );
  useEffect(() => {
    if (rotaryMode > 0) {
      setBorderless(false);
      setPassThrough(false);
    }
  }, [rotaryMode]);
  useEffect(() => {
    if (borderless) setRotaryMode(0);
    else if (supportInfo.openBottom) setPassThrough(false);
  }, [supportInfo, borderless]);
  useEffect(() => {
    if (passThrough) setRotaryMode(0);
  }, [passThrough]);
  useEffect(() => {
    if (borderless) setPassThroughHeight((cur) => Math.max(cur, workareaObj.height));
  }, [borderless, workareaObj]);

  const handleRotaryModeChange = (on: boolean) => setRotaryMode(on ? 1 : 0);

  const showPassThrough = supportInfo.passThrough && (supportInfo.openBottom ? borderless : true);

  const handleSave = () => {
    BeamboxPreference.write('engrave_dpi', engraveDpi);
    const dpiEvent = eventEmitterFactory.createEventEmitter('dpi-info');
    dpiEvent.emit('UPDATE_DPI', engraveDpi);
    BeamboxPreference.write('borderless', supportInfo.openBottom && borderless);
    BeamboxPreference.write('enable-diode', supportInfo.hybridLaser && enableDiode);
    BeamboxPreference.write('enable-autofocus', supportInfo.autoFocus && enableAutofocus);
    const workareaChanged = workarea !== origWorkarea;
    let customDimensionChanged = false;
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
    const rotaryChanged =
      rotaryMode !== BeamboxPreference.read('rotary_mode') ||
      extendRotaryWorkarea !== !!BeamboxPreference.read('extend-rotary-workarea');
    BeamboxPreference.write('rotary_mode', rotaryMode);
    if (rotaryMode > 0) {
      if (supportInfo.rotary.extendWorkarea)
        BeamboxPreference.write('extend-rotary-workarea', extendRotaryWorkarea);
      if (supportInfo.rotary.mirror) BeamboxPreference.write('rotary-mirror', mirrorRotary);
    }
    const newPassThrough = showPassThrough && passThrough;
    const passThroughChanged = newPassThrough !== !!BeamboxPreference.read('pass-through');
    BeamboxPreference.write('pass-through', newPassThrough);
    const passThroughHeightChanged =
      passThroughHeight !== BeamboxPreference.read('pass-through-height');
    BeamboxPreference.write('pass-through-height', passThroughHeight);
    BeamboxPreference.write('enable-job-origin', enableJobOrigin);
    BeamboxPreference.write('job-origin', jobOrigin);
    if (
      workareaChanged ||
      customDimensionChanged ||
      rotaryChanged ||
      passThroughChanged ||
      passThroughHeightChanged
    ) {
      changeWorkarea(workarea, { toggleModule: workareaChanged });
      rotaryAxis.toggleDisplay();
    } else {
      // this is called in changeWorkarea
      OpenBottomBoundaryDrawer.update();
      if (supportInfo.hybridLaser && enableDiode) diodeBoundaryDrawer.show();
      else diodeBoundaryDrawer.hide();
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
      open
      centered
      width={440}
      title={tDocu.document_settings}
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
              id: 'save-document-settings',
              message: tDocu.notification.changeFromPrintingWorkareaTitle,
              messageIcon: 'notice',
              buttonType: alertConstants.CONFIRM_CANCEL,
              onConfirm: () => resolve(true),
              onCancel: () => resolve(false),
            });
          });
          if (!res) return;
        }
        handleSave();
        unmount();
      }}
      cancelText={tGlobal.cancel}
      okText={tGlobal.save}
    >
      <div className={styles.container}>
        <div className={styles.block}>
          <div className={styles.row}>
            <label className={styles.title} htmlFor="workareaSelect">
              {tDocu.machine}:
            </label>
            <Select
              id="workareaSelect"
              value={workarea}
              className={styles.control}
              bordered
              onChange={setWorkarea}
            >
              {workareaOptions.map((option) => (
                <Select.Option key={option.value} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </div>
          {workareaObj.dismensionCustomizable && (
            <div className={styles.row}>
              <label className={styles.title} htmlFor="customDimension">
                {tDocu.workarea}:
              </label>
              <Select
                id="customDimension"
                value={customDimension[workarea]?.width ?? workareaObj.width}
                className={styles.control}
                bordered
                onChange={(val) =>
                  setCustomDimension((cur) => ({
                    ...cur,
                    [workarea]: { width: val, height: val },
                  }))
                }
              >
                {pmWorkareaOptions.map((val) => (
                  <Select.Option key={val} value={val}>
                    {`${val} x ${val} mm`}
                  </Select.Option>
                ))}
              </Select>
            </div>
          )}
          {isPromark && (
            <div className={styles.row}>
              <label className={styles.title} htmlFor="pm-laser-source">
                {tDocu.laser_source}:
              </label>
              <Select
                id="pm-laser-source"
                value={`${pmInfo.laserType}-${pmInfo.watt}`}
                className={styles.control}
                bordered
                onChange={(val) => {
                  const [type, watt] = val.split('-').map(Number);
                  setPmInfo({ laserType: type, watt });
                }}
              >
                {promarkLaserOptions.map(({ label, value }) => (
                  <Select.Option key={value} value={value}>
                    {label}
                  </Select.Option>
                ))}
              </Select>
            </div>
          )}
          <div className={styles.row}>
            <label className={styles.title} htmlFor="dpi">
              {tDocu.engrave_dpi}:
            </label>
            <Select
              id="dpi"
              value={engraveDpi}
              className={styles.control}
              bordered
              onChange={setEngraveDpi}
            >
              {dpiOptions.map((val) => (
                <Select.Option key={val} value={val}>
                  {tDocu[val]} ({constant.dpiValueMap[val]} DPI)
                </Select.Option>
              ))}
            </Select>
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
                  id="startFrom"
                  value={enableJobOrigin}
                  className={styles.control}
                  bordered
                  onChange={setEnableJobOrigin}
                >
                  <Select.Option value={0}>{tDocu.origin}</Select.Option>
                  <Select.Option value={1}>{tDocu.current_position}</Select.Option>
                </Select>
              </div>
              {enableJobOrigin === 1 && (
                <div className={styles.row}>
                  <label className={styles.title}>{tDocu.job_origin}:</label>
                  <div className={styles.control}>
                    <div className={styles.radioGroup}>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((val) => (
                        <input
                          id={`jobOrigin-${val}`}
                          key={val}
                          name="jobOrigin"
                          type="radio"
                          checked={jobOrigin === val}
                          onChange={() => setJobOrigin(val)}
                        />
                      ))}
                    </div>
                    <div className={styles['job-origin-example']}>
                      <img src="core-img/document-panel/job-origin-example.jpg" alt="Origin" />
                      <div
                        className={classNames(styles.mark, {
                          [styles.l]: jobOrigin % 3 === 1,
                          [styles.m]: jobOrigin % 3 === 2,
                          [styles.r]: jobOrigin % 3 === 0,
                          [styles.t]: jobOrigin <= 3,
                          [styles.c]: jobOrigin > 3 && jobOrigin <= 6,
                          [styles.b]: jobOrigin > 6,
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
                  id="start_button"
                  className={styles.switch}
                  checked={enableStartButton}
                  onChange={setEnableStartButton}
                />
                {enableStartButton && (
                  <div className={styles.subCheckbox}>
                    <div>
                      <Checkbox
                        id="frame_before_start"
                        checked={shouldFrame}
                        onChange={(e) => setShouldFrame(e.target.checked)}
                      >
                        {tDocu.frame_before_start}
                      </Checkbox>
                      <QuestionCircleOutlined
                        onClick={() => browser.open(tDocu.frame_before_start_url)}
                      />
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
                  id="rotary_mode"
                  className={styles.switch}
                  checked={rotaryMode > 0}
                  disabled={!supportInfo.rotary}
                  onChange={handleRotaryModeChange}
                />
                {(supportInfo.rotary.mirror || supportInfo.rotary.extendWorkarea) &&
                  rotaryMode > 0 && (
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
                          <Checkbox
                            checked={mirrorRotary}
                            onChange={(e) => setMirrorRotary(e.target.checked)}
                          >
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
                  id="autofocus-module"
                  className={styles.switch}
                  checked={supportInfo.autoFocus && enableAutofocus}
                  disabled={!supportInfo.autoFocus}
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
                  id="borderless_mode"
                  className={styles.switch}
                  checked={supportInfo.openBottom && borderless}
                  disabled={!supportInfo.openBottom}
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
                  id="diode_module"
                  className={styles.switch}
                  checked={supportInfo.hybridLaser && enableDiode}
                  disabled={!supportInfo.hybridLaser}
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
                  id="pass_through"
                  className={styles.switch}
                  checked={supportInfo.passThrough && passThrough}
                  disabled={!supportInfo.passThrough}
                  onChange={setPassThrough}
                />
                {passThrough && (
                  <>
                    <UnitInput
                      id="pass_through_height"
                      className={styles.input}
                      value={passThroughHeight}
                      min={workareaObj.displayHeight ?? workareaObj.height}
                      addonAfter={isInch ? 'in' : 'mm'}
                      isInch={isInch}
                      precision={isInch ? 2 : 0}
                      onChange={setPassThroughHeight}
                      size="small"
                    />
                    <Tooltip title={tDocu.pass_through_height_desc}>
                      <QuestionCircleOutlined className={styles.hint} />
                    </Tooltip>
                  </>
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
