import React, { useMemo, useState } from 'react';
import { Checkbox, Modal, Segmented, Switch } from 'antd';

import beamboxPreference from 'app/actions/beambox/beambox-preference';
import changeWorkarea from 'app/svgedit/operations/changeWorkarea';
import localeHelper from 'helpers/locale-helper';
import RotaryIcons from 'app/icons/rotary/RotaryIcons';
import rotaryAxis from 'app/actions/canvas/rotary-axis';
import storage from 'implementations/storage';
import UnitInput from 'app/widgets/UnitInput';
import useI18n from 'helpers/useI18n';
import { addDialogComponent, isIdExist, popDialogById } from 'app/actions/dialog-controller';
import { CHUCK_ROTARY_DIAMETER, getSupportInfo, RotaryType } from 'app/constants/add-on';

import styles from './RotarySettings.module.scss';

interface Props {
  onClose: () => void;
}

const RotarySettings = ({ onClose }: Props): JSX.Element => {
  const {
    topbar: { menu: tMenu },
    global: tGlobal,
    rotary_settings: t,
    beambox: { document_panel: tDocu },
  } = useI18n();

  const workarea = useMemo(() => beamboxPreference.read('workarea'), []);
  const supportInfo = useMemo(() => getSupportInfo(workarea), [workarea]);
  const [rotaryMode, setRotaryMode] = useState<number>(beamboxPreference.read('rotary_mode') ?? 0);
  const [rotaryType, setRotaryType] = useState<number>(
    beamboxPreference.read('rotary-type') || RotaryType.Roller
  );
  const [diameter, setDiaMeter] = useState<number>(
    beamboxPreference.read('rotary-chuck-obj-d') ?? CHUCK_ROTARY_DIAMETER
  );
  const [extend, setExtend] = useState<boolean>(
    Boolean(beamboxPreference.read('extend-rotary-workarea'))
  );
  const [mirror, setMirror] = useState<boolean>(Boolean(beamboxPreference.read('rotary-mirror')));
  const isInch = useMemo(() => storage.get('default-units') === 'inches', []);

  const handleSave = async () => {
    const rotaryChanged = rotaryMode !== beamboxPreference.read('rotary_mode');
    const extendChanged = extend !== Boolean(beamboxPreference.read('extend-rotary-workarea'));
    beamboxPreference.write('rotary_mode', rotaryMode);
    beamboxPreference.write('rotary-type', rotaryType);
    if (rotaryType === RotaryType.Chuck) beamboxPreference.write('rotary-chuck-obj-d', diameter);
    if (supportInfo.rotary.mirror) beamboxPreference.write('rotary-mirror', mirror);
    if (supportInfo.rotary.extendWorkarea)
      beamboxPreference.write('extend-rotary-workarea', extend);
    if (rotaryChanged || extendChanged) changeWorkarea(workarea, { toggleModule: false });
    if (rotaryChanged) rotaryAxis.toggleDisplay();
  };
  const rotaryDisabled = rotaryMode === 0;
  const chuckOptionDisabled =
    rotaryDisabled || !supportInfo.rotary.chuck || rotaryType !== RotaryType.Chuck;

  return (
    <Modal
      open
      centered
      title={tMenu.rotary_setup}
      onCancel={onClose}
      onOk={() => {
        handleSave();
        onClose();
      }}
      cancelText={tGlobal.cancel}
      okText={tGlobal.save}
    >
      <div className={styles.container}>
        <div className={styles.table}>
          <div className={styles.title}>
            <label htmlFor="rotary_mode">{tDocu.rotary_mode}</label>
          </div>
          <div className={styles.control}>
            <Switch
              id="rotary_mode"
              className={styles.switch}
              checked={rotaryMode > 0}
              onChange={() => setRotaryMode((cur) => (cur > 0 ? 0 : 1))}
            />
          </div>
          <div className={styles.title}>
            <label htmlFor="rotary_type">{t.type}</label>
          </div>
          <div className={styles.control}>
            <Segmented
              id="rotary_type"
              disabled={rotaryDisabled || !supportInfo.rotary.chuck}
              value={supportInfo.rotary.chuck ? rotaryType : RotaryType.Roller}
              onChange={(val: RotaryType) => setRotaryType(val)}
              options={[
                {
                  label: (
                    <div className={styles.seg}>
                      <RotaryIcons.Roller />
                      <div>Roller</div>
                    </div>
                  ),
                  value: RotaryType.Roller,
                },
                {
                  label: (
                    <div className={styles.seg}>
                      <RotaryIcons.Chuck />
                      <div>{localeHelper.isTwOrHk ? 'Chuck' : 'Coming Soon'}</div>
                    </div>
                  ),
                  value: RotaryType.Chuck,
                  disabled: !localeHelper.isTwOrHk,
                },
              ]}
            />
          </div>
          <div className={styles.title}>
            <label htmlFor="object_diameter">{t.object_diameter}</label>
          </div>
          <div className={styles.control}>
            <UnitInput
              id="object_diameter"
              disabled={chuckOptionDisabled}
              className={styles.input}
              value={diameter}
              min={0}
              addonAfter={isInch ? 'in' : 'mm'}
              isInch={isInch}
              precision={isInch ? 4 : 2}
              onChange={setDiaMeter}
            />
          </div>
          <div className={styles.title}>
            <label htmlFor="circumference">{t.circumference}</label>
          </div>
          <div className={styles.control}>
            <UnitInput
              id="circumference"
              disabled={chuckOptionDisabled}
              className={styles.input}
              value={diameter * Math.PI}
              min={0}
              addonAfter={isInch ? 'in' : 'mm'}
              isInch={isInch}
              precision={isInch ? 6 : 4}
              onChange={(val) => setDiaMeter(val / Math.PI)}
            />
          </div>
          {(supportInfo.rotary.mirror || supportInfo.rotary.extendWorkarea) && (
            <div className={styles.row}>
              {supportInfo.rotary.mirror && (
                <Checkbox
                  id="mirror"
                  disabled={rotaryDisabled}
                  checked={mirror}
                  onChange={(e) => setMirror(e.target.checked)}
                >
                  {tDocu.mirror}
                </Checkbox>
              )}
              {supportInfo.rotary.extendWorkarea && (
                <Checkbox
                  id="extend"
                  disabled={rotaryDisabled}
                  checked={extend}
                  onChange={(e) => setExtend(e.target.checked)}
                >
                  {tDocu.extend_workarea}
                </Checkbox>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default RotarySettings;

export const showRotarySettings = (): void => {
  if (!isIdExist('rotary-settings')) {
    addDialogComponent(
      'rotary-settings',
      <RotarySettings onClose={() => popDialogById('rotary-settings')} />
    );
  }
};
