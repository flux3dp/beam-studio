import React, { useEffect, useMemo, useState } from 'react';

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
import { createParamsSource, type OffsetParams } from './offsetParams';

export interface CameraTabProps {
  device: IDeviceInfo;
}

/**
 * Camera offsets per model, see docs/prd/manual-calibration-config.md §7.2:
 * `offset` of fisheye_params.json is the region preview (the whole preview on ado1 / Promark),
 * `region_offsets` is the wide-angle preview: fbm2 keeps it in the same file, bb2 / hx2 in wide-angle.json.
 */
const CameraTab = ({ device }: CameraTabProps): React.JSX.Element => {
  const t = useI18n().manual_config;
  const { model, serial } = device;
  const isLegacy = legacyBeamSeriesModels.has(model);
  const isPromark = promarkModels.has(model);
  const hasWideAngle = modelsWithWideAngleCamera.includes(model) || model === 'fbm2';
  const [pnc, setPnc] = useState<PncOffset | undefined>();

  useEffect(() => {
    if (!isLegacy) fetchPncOffset(serial).then(setPnc);
  }, [isLegacy, serial]);

  // every camera write clears the Print and Cut offset (setFisheyeConfig does it itself), so the toggle goes away
  const { main, wide } = useMemo(() => {
    const promark = createParamsSource(
      async () => promarkDataStore.get(serial, 'cameraParameters'),
      async (params: OffsetParams) => {
        promarkDataStore.set(serial, 'cameraParameters', params as PromarkCameraParameters);
        await clearPncOffset(serial);
        setPnc(undefined);
      },
    );
    const fisheye = createParamsSource(
      () => loadJson('fisheye', 'fisheye_params.json'),
      async (params) => {
        await setFisheyeConfig(params);
        setPnc(undefined);
      },
    );
    const wideAngle = createParamsSource(
      () => loadJson('fisheye', 'wide-angle.json'),
      async (params) => {
        await uploadJson(params, 'fisheye', 'wide-angle.json');
        await clearPncOffset(serial);
        setPnc(undefined);
      },
    );

    return { main: isPromark ? promark : fisheye, wide: model === 'fbm2' ? fisheye : wideAngle };
  }, [isPromark, model, serial]);

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
      <FisheyeOffsetBlock
        id="camera.main"
        kind="offset"
        pnc={pnc}
        source={main}
        title={hasWideAngle ? t.fisheye_region : undefined}
      />
      {hasWideAngle && <FisheyeOffsetBlock id="camera.wide" kind="regions" source={wide} title={t.fisheye_full_area} />}
    </div>
  );
};

export default CameraTab;
