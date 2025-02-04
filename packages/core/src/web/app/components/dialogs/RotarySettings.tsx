import React, { useMemo, useState } from 'react';

import { Checkbox, Modal, Segmented, Switch } from 'antd';

import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import rotaryAxis from '@core/app/actions/canvas/rotary-axis';
import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import { CHUCK_ROTARY_DIAMETER, getSupportInfo, RotaryType } from '@core/app/constants/add-on';
import RotaryIcons from '@core/app/icons/rotary/RotaryIcons';
import changeWorkarea from '@core/app/svgedit/operations/changeWorkarea';
import UnitInput from '@core/app/widgets/UnitInput';
import { checkChuckRotary } from '@core/helpers/checkFeature';
import useI18n from '@core/helpers/useI18n';
import storage from '@core/implementations/storage';

import styles from './RotarySettings.module.scss';

interface Props {
  onClose: () => void;
}

const RotarySettings = ({ onClose }: Props): React.JSX.Element => {
  const {
    beambox: { document_panel: tDocu },
    global: tGlobal,
    rotary_settings: t,
    topbar: { menu: tMenu },
  } = useI18n();

  const workarea = useMemo(() => beamboxPreference.read('workarea'), []);
  const supportInfo = useMemo(() => getSupportInfo(workarea), [workarea]);
  const [rotaryMode, setRotaryMode] = useState<number>(beamboxPreference.read('rotary_mode') ?? 0);
  const [rotaryType, setRotaryType] = useState<number>(beamboxPreference.read('rotary-type') || RotaryType.Roller);
  const [diameter, setDiaMeter] = useState<number>(
    beamboxPreference.read('rotary-chuck-obj-d') ?? CHUCK_ROTARY_DIAMETER,
  );
  const [extend, setExtend] = useState<boolean>(Boolean(beamboxPreference.read('extend-rotary-workarea')));
  const [mirror, setMirror] = useState<boolean>(Boolean(beamboxPreference.read('rotary-mirror')));
  const isInch = useMemo(() => storage.get('default-units') === 'inches', []);

  const handleSave = async () => {
    const rotaryChanged = rotaryMode !== beamboxPreference.read('rotary_mode');
    const extendChanged = extend !== Boolean(beamboxPreference.read('extend-rotary-workarea'));

    beamboxPreference.write('rotary_mode', rotaryMode);
    beamboxPreference.write('rotary-type', rotaryType);

    if (rotaryType === RotaryType.Chuck) {
      beamboxPreference.write('rotary-chuck-obj-d', diameter);
    }

    if (supportInfo.rotary?.mirror) {
      beamboxPreference.write('rotary-mirror', mirror);
    }

    if (supportInfo.rotary?.extendWorkarea) {
      beamboxPreference.write('extend-rotary-workarea', extend);
    }

    if (rotaryChanged || extendChanged) {
      changeWorkarea(workarea, { toggleModule: false });
    }

    if (rotaryChanged) {
      rotaryAxis.toggleDisplay();
    }
  };
  const rotaryDisabled = rotaryMode === 0;
  const chuckOptionDisabled = rotaryDisabled || !supportInfo.rotary?.chuck || rotaryType !== RotaryType.Chuck;

  return (
    <Modal
      cancelText={tGlobal.cancel}
      centered
      okText={tGlobal.save}
      onCancel={onClose}
      onOk={() => {
        handleSave();
        onClose();
      }}
      open
      title={tMenu.rotary_setup}
    >
      <div className={styles.container}>
        <div className={styles.table}>
          <div className={styles.title}>
            <label htmlFor="rotary_mode">{tDocu.rotary_mode}</label>
          </div>
          <div className={styles.control}>
            <Switch
              checked={rotaryMode > 0}
              className={styles.switch}
              id="rotary_mode"
              onChange={() => setRotaryMode((cur) => (cur > 0 ? 0 : 1))}
            />
          </div>
          <div className={styles.title}>
            <label htmlFor="rotary_type">{t.type}</label>
          </div>
          <div className={styles.control}>
            <Segmented
              disabled={rotaryDisabled || !supportInfo.rotary?.chuck}
              id="rotary_type"
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
                  disabled: !checkChuckRotary(),
                  label: (
                    <div className={styles.seg}>
                      <RotaryIcons.Chuck />
                      <div>{checkChuckRotary() ? 'Chuck' : 'Coming Soon'}</div>
                    </div>
                  ),
                  value: RotaryType.Chuck,
                },
              ]}
              value={supportInfo.rotary?.chuck ? rotaryType : RotaryType.Roller}
            />
          </div>
          <div className={styles.title}>
            <label htmlFor="object_diameter">{t.object_diameter}</label>
          </div>
          <div className={styles.control}>
            <UnitInput
              addonAfter={isInch ? 'in' : 'mm'}
              className={styles.input}
              disabled={chuckOptionDisabled}
              id="object_diameter"
              isInch={isInch}
              min={0}
              onChange={(val) => {
                if (val) {
                  setDiaMeter(val);
                }
              }}
              precision={isInch ? 4 : 2}
              value={diameter}
            />
          </div>
          <div className={styles.title}>
            <label htmlFor="circumference">{t.circumference}</label>
          </div>
          <div className={styles.control}>
            <UnitInput
              addonAfter={isInch ? 'in' : 'mm'}
              className={styles.input}
              disabled={chuckOptionDisabled}
              id="circumference"
              isInch={isInch}
              min={0}
              onChange={(val) => {
                if (val) {
                  setDiaMeter(val / Math.PI);
                }
              }}
              precision={isInch ? 6 : 4}
              value={diameter * Math.PI}
            />
          </div>
          {(supportInfo.rotary?.mirror || supportInfo.rotary?.extendWorkarea) && (
            <div className={styles.row}>
              {supportInfo.rotary.mirror && (
                <Checkbox
                  checked={mirror}
                  disabled={rotaryDisabled}
                  id="mirror"
                  onChange={(e) => setMirror(e.target.checked)}
                >
                  {tDocu.mirror}
                </Checkbox>
              )}
              {supportInfo.rotary.extendWorkarea && (
                <Checkbox
                  checked={extend}
                  disabled={rotaryDisabled}
                  id="extend"
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
    addDialogComponent('rotary-settings', <RotarySettings onClose={() => popDialogById('rotary-settings')} />);
  }
};
