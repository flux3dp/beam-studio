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
import NumberField from './NumberField';
import { useManualConfigStore, useRegisterSaver } from './store';

const PROGRESS_ID = 'manual-configuration-legacy-camera';

/** one row per device setting: `camera_offset`, plus `camera_offset_borderless` on open-bottom models */
type Row = {
  borderless: boolean;
  flip: boolean;
  stored: (CameraParameters & { flip: boolean }) | undefined;
  value: CameraParameters;
};

const KEYS = ['x', 'y', 'angle', 'scaleRatioX', 'scaleRatioY'] as const;
const DEG = 180 / Math.PI;
const ZERO: CameraParameters = { angle: 0, scaleRatioX: 1, scaleRatioY: 1, x: 0, y: 0 };

const settingName = (borderless: boolean) => (borderless ? 'camera_offset_borderless' : 'camera_offset');

export interface LegacyCameraBlockProps {
  device: IDeviceInfo;
}

const readRow = async (borderless: boolean): Promise<Row> => {
  try {
    const res = await deviceMaster.getDeviceSetting(settingName(borderless));
    const { flip, ...value } = { ...parseCameraOffset(res.value), flip: parseCameraFlip(res.value) };

    return { borderless, flip, stored: { ...value, flip }, value };
  } catch (error) {
    console.error('manual configuration: camera_offset read failed', error);

    return { borderless, flip: false, stored: undefined, value: ZERO };
  }
};

/**
 * Legacy pinhole camera (beamo, Beambox, HEXA): the whole `camera_offset` setting is editable. X / Y position
 * the camera relative to the head in mm, R rotates the photo (stored in rad, edited in degrees), SX / SY scale it.
 */
const LegacyCameraBlock = ({ device }: LegacyCameraBlockProps): React.JSX.Element => {
  const { calibration: tCal, global: tGlobal, manual_config: t } = useI18n();
  const [rows, setRows] = useState<null | Row[]>(null); // null = loading

  useEffect(() => {
    const names = getAddOnInfo(device.model).openBottom ? [false, true] : [false];

    Promise.all(names.map(readRow)).then(setRows);
  }, [device.model]);

  const changed =
    rows?.filter((row) => {
      if (!row.stored) return false;

      return KEYS.some((key) => row.value[key] !== row.stored![key]) || row.flip !== row.stored!.flip;
    }) ?? [];

  const handleSave = async () => {
    progressCaller.openNonstopProgress({ id: PROGRESS_ID, message: tGlobal.saving });
    try {
      for (const row of changed) {
        const { angle, scaleRatioX, scaleRatioY, x, y } = row.value;

        if (KEYS.some((key) => row.value[key] !== row.stored![key])) {
          await sendPictureThenSetConfig(
            { R: angle, SX: scaleRatioX, SY: scaleRatioY, X: x, Y: y },
            device,
            row.borderless,
            { clearPnc: false },
          );
        }

        if (row.flip !== row.stored!.flip) {
          // the firmware merges partial sets, so only F changes; the flip moves everything in the photo,
          // so the Print and Cut offset measured under the old orientation is void
          await deviceMaster.setDeviceSetting(settingName(row.borderless), `F:${row.flip ? 1 : 0}`);
          await clearPncOffset(device.serial);
          useManualConfigStore.getState().setPnc(undefined);

          // connectCamera reads F once per connection and caches it here; keep the next preview in sync
          if (deviceMaster.currentDevice) deviceMaster.currentDevice.cameraNeedsFlip = row.flip;
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

  const update = (i: number, patch: Partial<CameraParameters> & { flip?: boolean }) =>
    setRows((prev) =>
      prev!.map((row, j) => {
        if (i !== j) return row;

        const { flip = row.flip, ...value } = patch;

        return { ...row, flip, value: { ...row.value, ...value } };
      }),
    );

  return (
    <div className={styles.block}>
      <div className={styles.grid}>
        {rows?.map((row, i) => (
          <div key={String(row.borderless)}>
            <div className={styles.label}>{row.borderless ? t.legacy_borderless : t.legacy_camera}</div>
            {!row.stored && <div className={styles.hint}>{t.camera_load_failed}</div>}
            <div className={styles.inputs}>
              {(
                [
                  ['x', 'X', 'mm', 1],
                  ['y', 'Y', 'mm', 1],
                  ['angle', tCal.rotation_angle, 'deg', DEG],
                  ['scaleRatioX', tCal.x_ratio, 'ratio', 1],
                  ['scaleRatioY', tCal.y_ratio, 'ratio', 1],
                ] as const
              ).map(([key, label, kind, scale]) => (
                <NumberField
                  disabled={!row.stored}
                  key={key}
                  kind={kind}
                  label={label}
                  onChange={(next) => update(i, { [key]: next / scale })}
                  value={row.value[key] * scale}
                />
              ))}
            </div>
            {/* only camera_offset's F flips the photo: connectCamera never reads the open-lid setting's F */}
            {!row.borderless && (
              <label className={styles.switch}>
                <Switch
                  checked={row.flip}
                  disabled={!row.stored}
                  onChange={(flip) => update(i, { flip })}
                  size="small"
                />
                {t.legacy_flip}
              </label>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LegacyCameraBlock;
