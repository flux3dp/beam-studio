import type { ReactNode } from 'react';
import React, { memo } from 'react';

import { Switch } from 'antd';

import { todo } from '@core/helpers/is-dev';
import useI18n from '@core/helpers/useI18n';

import styles from './index.module.scss';

interface Props {
  innerEngraving: boolean;
  isCurveEngraving: boolean;
  renderWarningIcon: (tooltipText: string) => ReactNode;
  setInnerEngraving: (on: boolean) => void;
  show: boolean;
}

todo('gear icon opening InnerEngravingSettings (material shape / size / position / refractive index)');

const InnerEngravingBlock = memo(
  ({ innerEngraving, isCurveEngraving, renderWarningIcon, setInnerEngraving, show }: Props) => {
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
