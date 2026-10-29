import React, { useEffect, useState } from 'react';

import { Switch } from 'antd';
import { sprintf } from 'sprintf-js';

import alertCaller from '@core/app/actions/alert-caller';
import progressCaller from '@core/app/actions/progress-caller';
import useI18n from '@core/helpers/useI18n';

import type { PncOffset } from '../../PrintAndCut/calibration/offsetStore';

import styles from './ManualConfiguration.module.scss';
import type { OffsetParams } from './offsetParams';
import { useRegisterSaver } from './store';
import XyInputs from './XyInputs';

const PROGRESS_ID = 'manual-configuration-fisheye';
/** larger residuals mean the calibration itself is off, and push the sampled area out of the photo */
const RANGE = 5;

type Xy = { x: number; y: number };

export interface FisheyeOffsetBlockProps {
  /** read the stored params; null when the camera has not been calibrated */
  /** saver id in the modal store, `camera.<block>` */
  id: string;
  load: () => Promise<null | OffsetParams>;
  /** the stored Print and Cut offset; when given, a toggle previews `stored + pnc` as the value to save */
  pnc?: PncOffset;
  /** write the params back (with `offset` set); must clear the Print and Cut offset like every camera write */
  save: (params: OffsetParams) => Promise<void>;
  title: string;
}

/**
 * One fisheye camera's manual bed-plane offset in mm (fluxghost adds it to the grid object points before
 * projection, see docs/prd/manual-calibration-config.md §7.3). The params object is kept whole and only
 * `offset` changes on save.
 */
const FisheyeOffsetBlock = ({ id, load, pnc, save, title }: FisheyeOffsetBlockProps): React.JSX.Element => {
  const {
    global: tGlobal,
    manual_config: t,
    print_and_cut: { calibration: tPnc },
  } = useI18n();
  const [params, setParams] = useState<null | OffsetParams | undefined>(null); // null = loading, undefined = none
  const [value, setValue] = useState<Xy>({ x: 0, y: 0 });
  const [usePnc, setUsePnc] = useState(false);

  useEffect(() => {
    load()
      .then((loaded) => {
        setParams(loaded ?? undefined);

        const [x, y] = loaded?.offset ?? [0, 0];

        setValue({ x, y });
      })
      .catch((error) => {
        console.error('manual configuration: fisheye params read failed', error);
        setParams(undefined);
      });
  }, [load]);

  const stored = params?.offset ?? [0, 0];
  const changed = Boolean(params) && (value.x !== stored[0] || value.y !== stored[1]);

  const handleSave = async () => {
    progressCaller.openNonstopProgress({ id: PROGRESS_ID, message: tGlobal.saving });
    try {
      const next = { ...params!, offset: [value.x, value.y] as [number, number] };

      await save(next);
      setParams(next);
      setUsePnc(false); // the write cleared pnc.json, the toggle has nothing left to apply
    } catch (error) {
      console.error('manual configuration: fisheye offset write failed', error);
      alertCaller.popUpError({ message: t.save_failed });
    } finally {
      progressCaller.popById(PROGRESS_ID);
    }
  };

  useRegisterSaver(id, changed, handleSave);

  // on: drop unsaved edits and show what the machine holds plus the residual the vernier measured; off: back to stored
  const togglePnc = (on: boolean) => {
    setUsePnc(on);
    setValue(on ? { x: stored[0] + pnc!.x, y: stored[1] + pnc!.y } : { x: stored[0], y: stored[1] });
  };

  return (
    <div>
      <div className={styles.label}>{title}</div>
      {params === undefined && <div className={styles.hint}>{t.camera_not_calibrated}</div>}
      <XyInputs disabled={!params || usePnc} max={RANGE} min={-RANGE} onChange={setValue} value={value} />
      {pnc && (
        <>
          <label className={styles.switch}>
            <Switch checked={usePnc} disabled={!params} onChange={togglePnc} size="small" />
            {t.apply_pnc}
          </label>
          <div className={styles.hint}>{sprintf(tPnc.current_offset, pnc.x.toFixed(2), pnc.y.toFixed(2))}</div>
        </>
      )}
    </div>
  );
};

export default FisheyeOffsetBlock;
