import React, { useEffect, useState } from 'react';

import { Segmented, Switch } from 'antd';
import { sprintf } from 'sprintf-js';

import alertCaller from '@core/app/actions/alert-caller';
import progressCaller from '@core/app/actions/progress-caller';
import useI18n from '@core/helpers/useI18n';

import type { PncOffset } from '../../PrintAndCut/calibration/offsetStore';

import styles from './ManualConfiguration.module.scss';
import { isUniform, type ParamsSource, type RegionOffsets, REGIONS, sameForAll } from './offsetParams';
import RegionOffsetGrid from './RegionOffsetGrid';
import { useRegisterSaver } from './store';
import XyInputs from './XyInputs';

const PROGRESS_ID = 'manual-configuration-fisheye';
/** larger residuals mean the calibration itself is off, and push the sampled area out of the photo */
const RANGE = 5;

type Xy = { x: number; y: number };

const ZERO: Xy = { x: 0, y: 0 };
const toXy = ([x, y]: [number, number]): Xy => ({ x, y });

export interface FisheyeOffsetBlockProps {
  /** saver id in the modal store, `camera.<block>` */
  id: string;
  /**
   * `offset`: the single mm offset (region preview, or the whole preview on full-area-only cameras).
   * `regions`: the wide-angle preview's nine `region_offsets`, edited as one value or per region.
   */
  kind: 'offset' | 'regions';
  /** the stored Print and Cut offset; when given, a toggle previews `stored + pnc` as the value to save */
  pnc?: PncOffset;
  source: ParamsSource;
  title?: string;
}

/**
 * One editable field of a fisheye camera's params, in mm. fluxghost adds the offset to the grid object
 * points before projection (docs/prd/manual-calibration-config.md §7.3); the params file is written whole
 * by the shared source, this block only patches its field.
 */
const FisheyeOffsetBlock = ({ id, kind, pnc, source, title }: FisheyeOffsetBlockProps): React.JSX.Element => {
  const {
    global: tGlobal,
    manual_config: t,
    print_and_cut: { calibration: tPnc },
  } = useI18n();
  const [loaded, setLoaded] = useState<boolean | null>(null); // null = loading, false = not calibrated
  // what the machine holds, in this block's shape
  const [stored, setStored] = useState<{ regions?: RegionOffsets; value: Xy }>({ value: ZERO });
  const [value, setValue] = useState<Xy>(ZERO);
  const [regions, setRegions] = useState<RegionOffsets>(() => sameForAll([0, 0]));
  const [perRegion, setPerRegion] = useState(false);
  const [usePnc, setUsePnc] = useState(false);

  useEffect(() => {
    source.load().then((params) => {
      setLoaded(Boolean(params));

      if (!params) return;

      if (kind === 'offset') {
        const xy = toXy(params.offset ?? [0, 0]);

        setStored({ value: xy });
        setValue(xy);
      } else {
        const storedRegions = 'region_offsets' in params ? params.region_offsets : undefined;
        const uniform = !storedRegions || isUniform(storedRegions);
        const xy = toXy(storedRegions?.topLeft ?? [0, 0]);

        setStored({ regions: storedRegions, value: xy });
        setValue(xy);
        setRegions(storedRegions ?? sameForAll([0, 0]));
        setPerRegion(!uniform);
      }
    });
  }, [source, kind]);

  const nextRegions = (): RegionOffsets => (perRegion ? regions : sameForAll([value.x, value.y]));
  const changed =
    loaded === true &&
    (kind === 'offset'
      ? value.x !== stored.value.x || value.y !== stored.value.y
      : REGIONS.some((r) => {
          const [x, y] = nextRegions()[r];
          const [sx, sy] = stored.regions?.[r] ?? [0, 0];

          return x !== sx || y !== sy;
        }));

  const handleSave = async () => {
    progressCaller.openNonstopProgress({ id: PROGRESS_ID, message: tGlobal.saving });
    try {
      if (kind === 'offset') {
        await source.save({ offset: [value.x, value.y] });
        setStored({ value });
        setUsePnc(false); // the write cleared pnc.json, the toggle has nothing left to apply
      } else {
        const next = nextRegions();

        await source.save({ region_offsets: next });
        setStored({ regions: next, value: toXy(next.topLeft) });
        setRegions(next);
      }
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
    setValue(on ? { x: stored.value.x + pnc!.x, y: stored.value.y + pnc!.y } : stored.value);
  };

  // switching to per region starts from the single value, so nothing jumps
  const switchMode = (mode: string) => {
    const toRegions = mode === 'regions';

    if (toRegions && !perRegion) setRegions(sameForAll([value.x, value.y]));

    setPerRegion(toRegions);
  };

  const disabled = loaded !== true;

  return (
    <div className={styles.section}>
      {(title || kind === 'regions') && (
        <div className={styles.sectionHeader}>
          <span>{title}</span>
          {kind === 'regions' && (
            <Segmented
              disabled={disabled}
              onChange={switchMode}
              options={[
                { label: t.wide_angle_single, value: 'single' },
                { label: t.wide_angle_per_region, value: 'regions' },
              ]}
              value={perRegion ? 'regions' : 'single'}
            />
          )}
        </div>
      )}
      {loaded === false && <div className={styles.hint}>{t.camera_not_calibrated}</div>}
      {kind === 'regions' && perRegion ? (
        <RegionOffsetGrid disabled={disabled} max={RANGE} min={-RANGE} onChange={setRegions} value={regions} />
      ) : (
        <XyInputs disabled={disabled || usePnc} max={RANGE} min={-RANGE} onChange={setValue} value={value} />
      )}
      {kind === 'offset' && pnc && (
        <>
          <label className={styles.switch}>
            <Switch checked={usePnc} disabled={disabled} onChange={togglePnc} size="small" />
            {t.apply_pnc}
          </label>
          <div className={styles.hint}>{sprintf(tPnc.current_offset, pnc.x.toFixed(2), pnc.y.toFixed(2))}</div>
        </>
      )}
    </div>
  );
};

export default FisheyeOffsetBlock;
