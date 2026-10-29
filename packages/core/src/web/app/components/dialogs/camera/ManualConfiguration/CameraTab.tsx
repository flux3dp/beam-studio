import React from 'react';

import { legacyBeamSeriesModels } from '@core/app/actions/beambox/constant';
import useI18n from '@core/helpers/useI18n';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import LegacyCameraBlock from './LegacyCameraBlock';
import styles from './ManualConfiguration.module.scss';

export interface CameraTabProps {
  device: IDeviceInfo;
}

/** Camera offsets per model, see docs/prd/manual-calibration-config.md §7.2 */
const CameraTab = ({ device }: CameraTabProps): React.JSX.Element => {
  const t = useI18n().manual_config;
  const { model } = device;

  if (legacyBeamSeriesModels.has(model)) {
    return (
      <div className={styles.tab}>
        <div className={styles.desc}>{t.legacy_desc}</div>
        <LegacyCameraBlock device={device} />
      </div>
    );
  }

  return <div className={styles.tab} />;
};

export default CameraTab;
