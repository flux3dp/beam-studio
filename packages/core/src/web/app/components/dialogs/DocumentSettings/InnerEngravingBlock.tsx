import type { ReactNode } from 'react';
import React, { memo } from 'react';

import { SettingFilled } from '@ant-design/icons';
import { Switch } from 'antd';

import { showInnerEngravingSettings } from '@core/app/components/dialogs/InnerEngravingSettings';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import useI18n from '@core/helpers/useI18n';

import styles from './index.module.scss';

interface Props {
  innerEngraving: boolean;
  isCurveEngraving: boolean;
  renderWarningIcon: (tooltipText: string) => ReactNode;
  setInnerEngraving: (on: boolean) => void;
  show: boolean;
  /** The work area being edited here, which may not be saved yet. */
  workarea: WorkAreaModel;
}

const InnerEngravingBlock = memo(
  ({ innerEngraving, isCurveEngraving, renderWarningIcon, setInnerEngraving, show, workarea }: Props) => {
    const {
      beambox: { document_panel: tDocument },
      global: tGlobal,
    } = useI18n();

    if (!show) return null;

    return (
      <div className={styles.block}>
        <div className={styles.row}>
          <div className={styles.title}>
            <label htmlFor="innerEngraving">
              <strong>{tDocument.inner_engraving}</strong>
            </label>
            {renderWarningIcon(tGlobal.mode_conflict)}
            {/* the material settings stand on their own: they are saved by their own dialog, so they
                stay editable whether or not the mode is being turned on in this session */}
            <SettingFilled className={styles.icon} onClick={() => showInnerEngravingSettings(workarea)} />
          </div>
          <div className={styles.control}>
            <Switch
              checked={innerEngraving}
              disabled={isCurveEngraving}
              id="innerEngraving"
              onChange={setInnerEngraving}
            />
          </div>
        </div>
      </div>
    );
  },
);

export default InnerEngravingBlock;
