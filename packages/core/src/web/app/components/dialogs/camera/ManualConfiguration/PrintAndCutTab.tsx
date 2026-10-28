import React, { useEffect, useState } from 'react';

import { Button } from 'antd';

import alertCaller from '@core/app/actions/alert-caller';
import progressCaller from '@core/app/actions/progress-caller';
import useI18n from '@core/helpers/useI18n';

import {
  clearPncOffset,
  fetchPncOffset,
  type PncOffset,
  savePncOffset,
} from '../../PrintAndCut/calibration/offsetStore';

import styles from './ManualConfiguration.module.scss';
import XyInputs from './XyInputs';

const PROGRESS_ID = 'manual-configuration-pnc';
const ZERO: PncOffset = { x: 0, y: 0 };

export interface PrintAndCutTabProps {
  serial: string;
}

/** View, edit and clear the Print and Cut offset (machine camera_calib/pnc.json, else local by serial) */
const PrintAndCutTab = ({ serial }: PrintAndCutTabProps): React.JSX.Element => {
  const { global: tGlobal, manual_config: t } = useI18n();
  const [stored, setStored] = useState<null | PncOffset | undefined>(null); // null = loading
  const [value, setValue] = useState<PncOffset>(ZERO);

  useEffect(() => {
    fetchPncOffset(serial).then((offset) => {
      setStored(offset);
      setValue(offset ?? ZERO);
    });
  }, [serial]);

  const run = async (action: () => Promise<void>, next: PncOffset | undefined) => {
    progressCaller.openNonstopProgress({ id: PROGRESS_ID, message: tGlobal.saving });
    try {
      await action();
      setStored(next);
      setValue(next ?? ZERO);
    } catch (error) {
      console.error('manual configuration: print and cut offset write failed', error);
      alertCaller.popUpError({ message: t.save_failed });
    } finally {
      progressCaller.popById(PROGRESS_ID);
    }
  };

  const loading = stored === null;

  return (
    <div className={styles.tab}>
      <div className={styles.desc}>{t.pnc_desc}</div>
      {stored === undefined && <div className={styles.hint}>{t.pnc_not_set}</div>}
      <XyInputs disabled={loading} onChange={setValue} value={value} />
      <div className={styles.actions}>
        <Button disabled={loading || stored === undefined} onClick={() => run(() => clearPncOffset(serial), undefined)}>
          {t.clear}
        </Button>
        <Button disabled={loading} onClick={() => run(() => savePncOffset(serial, value), value)} type="primary">
          {tGlobal.save}
        </Button>
      </div>
    </div>
  );
};

export default PrintAndCutTab;
