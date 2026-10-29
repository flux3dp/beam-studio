import React, { useCallback, useEffect, useState } from 'react';

import { legacyBeamSeriesModels, modelsWithWideAngleCamera, promarkModels } from '@core/app/actions/beambox/constant';
import { setFisheyeConfig } from '@core/helpers/camera-calibration-helper';
import { loadJson, uploadJson } from '@core/helpers/device/jsonDataHelper';
import promarkDataStore from '@core/helpers/device/promark/promark-data-store';
import useI18n from '@core/helpers/useI18n';
import type { IDeviceInfo } from '@core/interfaces/IDevice';
import type { PromarkCameraParameters } from '@core/interfaces/Promark';

import { clearPncOffset, fetchPncOffset, type PncOffset } from '../../PrintAndCut/calibration/offsetStore';

import FisheyeOffsetBlock from './FisheyeOffsetBlock';
import LegacyCameraBlock from './LegacyCameraBlock';
import styles from './ManualConfiguration.module.scss';
import { isOffsetParams, type OffsetParams } from './offsetParams';

export interface CameraTabProps {
  device: IDeviceInfo;
}

const loadFisheyeParams = async (): Promise<null | OffsetParams> => {
  try {
    const data = await loadJson('fisheye', 'fisheye_params.json');

    return isOffsetParams(data) ? data : null;
  } catch {
    return null;
  }
};

const loadWideAngleParams = async (): Promise<null | OffsetParams> => {
  try {
    const data = await loadJson('fisheye', 'wide-angle.json');

    return isOffsetParams(data) ? data : null;
  } catch {
    return null;
  }
};

/** Camera offsets per model, see docs/prd/manual-calibration-config.md §7.2 */
const CameraTab = ({ device }: CameraTabProps): React.JSX.Element => {
  const t = useI18n().manual_config;
  const { model, serial } = device;
  const isLegacy = legacyBeamSeriesModels.has(model);
  const isPromark = promarkModels.has(model);
  const hasWideAngle = modelsWithWideAngleCamera.includes(model);
  const [pnc, setPnc] = useState<PncOffset | undefined>();

  useEffect(() => {
    if (!isLegacy) fetchPncOffset(serial).then(setPnc);
  }, [isLegacy, serial]);

  // Promark keeps its V3 params in local storage by serial instead of on the machine
  const loadPromark = useCallback(async () => promarkDataStore.get(serial, 'cameraParameters') ?? null, [serial]);
  // every camera write clears the Print and Cut offset (setFisheyeConfig does it itself), so the toggle goes away
  const savePromark = useCallback(
    async (params: OffsetParams) => {
      promarkDataStore.set(serial, 'cameraParameters', params as PromarkCameraParameters);
      await clearPncOffset(serial);
      setPnc(undefined);
    },
    [serial],
  );
  const saveFisheye = useCallback(async (params: OffsetParams) => {
    await setFisheyeConfig(params);
    setPnc(undefined);
  }, []);
  const saveWideAngle = useCallback(
    async (params: OffsetParams) => {
      await uploadJson(params, 'fisheye', 'wide-angle.json');
      await clearPncOffset(serial);
    },
    [serial],
  );

  if (isLegacy) {
    return (
      <div className={styles.tab}>
        <div className={styles.desc}>{t.legacy_desc}</div>
        <LegacyCameraBlock device={device} />
      </div>
    );
  }

  return (
    <div className={styles.tab}>
      <div className={styles.desc}>{t.fisheye_desc}</div>
      <div className={styles.grid}>
        <FisheyeOffsetBlock
          id="camera.main"
          load={isPromark ? loadPromark : loadFisheyeParams}
          pnc={pnc}
          save={isPromark ? savePromark : saveFisheye}
          title={hasWideAngle ? t.fisheye_region : t.fisheye_camera}
        />
        {hasWideAngle && (
          <FisheyeOffsetBlock
            id="camera.wide"
            load={loadWideAngleParams}
            save={saveWideAngle}
            title={t.fisheye_full_area}
          />
        )}
      </div>
    </div>
  );
};

export default CameraTab;
