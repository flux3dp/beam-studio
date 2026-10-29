import React, { useEffect, useState } from 'react';

import { Switch } from 'antd';

import alertCaller from '@core/app/actions/alert-caller';
import progressCaller from '@core/app/actions/progress-caller';
import { getAddOnInfo } from '@core/app/constants/addOn';
import { sendPictureThenSetConfig } from '@core/helpers/camera-calibration-helper';
import { parseCameraFlip, parseCameraOffset } from '@core/helpers/device/camera/cameraOffset';
import deviceMaster from '@core/helpers/device-master';
import useI18n from '@core/helpers/useI18n';
import type { CameraParameters } from '@core/interfaces/Camera';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import { clearPncOffset } from '../../PrintAndCut/calibration/offsetStore';

import styles from './ManualConfiguration.module.scss';
import { useRegisterSaver } from './store';
import XyInputs from './XyInputs';

const PROGRESS_ID = 'manual-configuration-legacy-camera';

type Xy = { x: number; y: number };
/** one row per device setting: `camera_offset`, plus `camera_offset_borderless` on open-bottom models */
type Row = {
  borderless: boolean;
  flip: boolean;
  stored: (CameraParameters & { flip: boolean }) | undefined;
  value: Xy;
};

const settingName = (borderless: boolean) => (borderless ? 'camera_offset_borderless' : 'camera_offset');

export interface LegacyCameraBlockProps {
  device: IDeviceInfo;
}

const readRow = async (borderless: boolean): Promise<Row> => {
  try {
    const res = await deviceMaster.getDeviceSetting(settingName(borderless));
    const stored = { ...parseCameraOffset(res.value), flip: parseCameraFlip(res.value) };

    return { borderless, flip: stored.flip, stored, value: { x: stored.x, y: stored.y } };
  } catch (error) {
    console.error('manual configuration: camera_offset read failed', error);

    return { borderless, flip: false, stored: undefined, value: { x: 0, y: 0 } };
  }
};

/**
 * Legacy pinhole camera (beamo, Beambox, HEXA): X / Y of the `camera_offset` setting are a pure
 * translation in mm, so they are the manual offset. R, SX, SY are kept as read and written back unchanged.
 */
const LegacyCameraBlock = ({ device }: LegacyCameraBlockProps): React.JSX.Element => {
  const { global: tGlobal, manual_config: t } = useI18n();
  const [rows, setRows] = useState<null | Row[]>(null); // null = loading

  useEffect(() => {
    const names = getAddOnInfo(device.model).openBottom ? [false, true] : [false];

    Promise.all(names.map(readRow)).then(setRows);
  }, [device.model]);

  const changed =
    rows?.filter((row) => {
      if (!row.stored) return false;

      return row.value.x !== row.stored!.x || row.value.y !== row.stored!.y || row.flip !== row.stored!.flip;
    }) ?? [];

  const handleSave = async () => {
    progressCaller.openNonstopProgress({ id: PROGRESS_ID, message: tGlobal.saving });
    try {
      for (const row of changed) {
        const { angle, flip, scaleRatioX, scaleRatioY } = row.stored!;
        const { x, y } = row.value;

        if (x !== row.stored!.x || y !== row.stored!.y) {
          await sendPictureThenSetConfig(
            { R: angle, SX: scaleRatioX, SY: scaleRatioY, X: x, Y: y },
            device,
            row.borderless,
          );
        }

        if (row.flip !== flip) {
          // the firmware merges partial sets, so only F changes; the flip moves everything in the photo,
          // so the Print and Cut offset measured under the old orientation is void
          await deviceMaster.setDeviceSetting(settingName(row.borderless), `F:${row.flip ? 1 : 0}`);
          await clearPncOffset(device.serial);

          // connectCamera reads F once per connection and caches it here; keep the next preview in sync
          if (!row.borderless && deviceMaster.currentDevice) deviceMaster.currentDevice.cameraNeedsFlip = row.flip;
        }
      }

      setRows((prev) =>
        prev!.map((row) => (row.stored ? { ...row, stored: { ...row.stored, ...row.value, flip: row.flip } } : row)),
      );
    } catch (error) {
      console.error('manual configuration: camera_offset write failed', error);
      alertCaller.popUpError({ message: t.save_failed });
    } finally {
      progressCaller.popById(PROGRESS_ID);
    }
  };

  useRegisterSaver('camera.legacy', Boolean(rows) && changed.length > 0, handleSave);

  return (
    <div className={styles.block}>
      <div className={styles.grid}>
        {rows?.map((row, i) => (
          <div key={String(row.borderless)}>
            <div className={styles.label}>{row.borderless ? t.legacy_borderless : t.legacy_camera}</div>
            {!row.stored && <div className={styles.hint}>{t.camera_load_failed}</div>}
            <XyInputs
              disabled={!row.stored}
              onChange={(value) => setRows((prev) => prev!.map((r, j) => (i === j ? { ...r, value } : r)))}
              value={row.value}
            />
            <label className={styles.switch}>
              <Switch
                checked={row.flip}
                disabled={!row.stored}
                onChange={(flip) => setRows((prev) => prev!.map((r, j) => (i === j ? { ...r, flip } : r)))}
                size="small"
              />
              {t.legacy_flip}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LegacyCameraBlock;
