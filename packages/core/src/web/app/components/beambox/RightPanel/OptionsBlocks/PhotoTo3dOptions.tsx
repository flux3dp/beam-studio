import React, { useEffect, useState } from 'react';

import { LoadingOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { InputNumber, Tooltip } from 'antd';

import type { PhotoTo3dSettings } from '@core/app/svgedit/stl/photoTo3d';
import {
  alertPhotoTo3dError,
  EDGE_ROUND_LIMIT,
  getPhotoTo3dSettings,
  SHARPEN_AMOUNT_LIMIT,
  SHARPEN_RADIUS_LIMIT,
  updatePhotoTo3d,
  usePhotoTo3dBusy,
} from '@core/app/svgedit/stl/photoTo3d';
import { PhotoTo3dCancelledError } from '@core/app/svgedit/stl/photoTo3d/runPhotoTo3d';
import useI18n from '@core/helpers/useI18n';

import styles from './ThreeDOptions.module.scss';

/** Only a computation that outlasts this shows as updating, so quick ones do not flicker. */
const BUSY_DELAY_MS = 300;

interface Props {
  elem: SVGImageElement;
}

const run = async (task: Promise<unknown>) => {
  try {
    await task;
  } catch (error) {
    if (!(error instanceof PhotoTo3dCancelledError)) alertPhotoTo3dError(error);
  }
};

/**
 * The parameters of a photo turned into 3D that change its point cloud: sharpening and the edge
 * roll-off. Each change recomputes the point cloud from the saved depth (never the API) in one
 * undo step; the depth itself is the object's Z size, in the dimension panel. A resize or a new layer
 * point spacing is followed by the canvas (`watchStalePhotoTo3d`), not here: the spacing is edited on
 * the layer tab, where this panel is not mounted.
 */
const PhotoTo3dOptions = ({ elem }: Props): React.JSX.Element => {
  const { inner_engraving_settings: t } = useI18n();
  const isBusy = usePhotoTo3dBusy((state) => state.ids.includes(elem.id));
  const [showBusy, setShowBusy] = useState(false);
  const [settings, setSettings] = useState<PhotoTo3dSettings>(() => getPhotoTo3dSettings(elem));

  // the element carries the settings only once a computation has ended; until then the fields keep
  // what was typed
  useEffect(() => {
    if (!isBusy) setSettings(getPhotoTo3dSettings(elem));
  }, [elem, isBusy]);

  useEffect(() => {
    if (!isBusy) {
      setShowBusy(false);

      return undefined;
    }

    const timer = setTimeout(() => setShowBusy(true), BUSY_DELAY_MS);

    return () => clearTimeout(timer);
  }, [isBusy]);

  const commit = (key: keyof PhotoTo3dSettings, value: null | number) => {
    if (value === null || value === settings[key]) return;

    setSettings((current) => ({ ...current, [key]: value }));
    run(updatePhotoTo3d(elem, { [key]: value }, 'new'));
  };

  const renderField = (
    key: keyof PhotoTo3dSettings,
    label: string,
    hint: string,
    { max, min }: { max: number; min: number },
    { precision, step, unit }: { precision: number; step: number; unit?: string },
  ) => (
    <div className={styles.row}>
      <span className={styles.label}>
        {label}
        <Tooltip title={hint}>
          <QuestionCircleOutlined className={styles.hint} />
        </Tooltip>
      </span>
      <div className={styles.input}>
        <InputNumber
          addonAfter={unit}
          // the value only counts once typing is done: each commit recomputes the whole point cloud
          defaultValue={settings[key]}
          id={`photo-to-3d-${key}`}
          key={`${key}-${settings[key]}`}
          max={max}
          min={min}
          onBlur={(e) => commit(key, Number(e.target.value))}
          onPressEnter={(e) => commit(key, Number((e.target as HTMLInputElement).value))}
          precision={precision}
          size="small"
          step={step}
        />
      </div>
    </div>
  );

  return (
    <div className={styles.block}>
      {renderField('sharpenAmount', t.photo_to_3d_sharpen, t.photo_to_3d_sharpen_hint, SHARPEN_AMOUNT_LIMIT, {
        precision: 1,
        step: 0.1,
      })}
      {renderField('sharpenRadius', t.photo_to_3d_sharpen_radius, t.photo_to_3d_sharpen_hint, SHARPEN_RADIUS_LIMIT, {
        precision: 1,
        step: 0.5,
      })}
      {renderField('edgeRoundPercent', t.photo_to_3d_edge_round, t.photo_to_3d_edge_round_hint, EDGE_ROUND_LIMIT, {
        precision: 1,
        step: 0.5,
        unit: '%',
      })}
      {showBusy && (
        <div className={styles.row} id="photo-to-3d-updating">
          <span className={styles.label}>
            <LoadingOutlined />
            {t.photo_to_3d_updating}
          </span>
        </div>
      )}
    </div>
  );
};

export default PhotoTo3dOptions;
