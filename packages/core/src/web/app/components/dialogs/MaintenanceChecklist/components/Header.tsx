import React, { useState } from 'react';

import { Progress } from 'antd';
import classNames from 'classnames';

import useI18n from '@core/helpers/useI18n';

// `shared` holds the `.dot`/`.ess` atoms, also used by TaskRow.
import shared from '../styles.module.scss';
import { useAllClearEdge } from '../useAllClearEdge';
import { useMaintenanceData } from '../useMaintenanceData';

import styles from './Header.module.scss';
import MachineSelect from './MachineSelect';

const RING_PULSE_MS = 1400;

/** Dialog header: machine picker, essential-health ring, status legend, and intro hint. */
const Header = (): React.JSX.Element => {
  const t = useI18n().maintenance;
  const { health, record } = useMaintenanceData();

  // Pulse the health ring when the user completes the checklist (same-machine all-clear edge).
  const [pulse, setPulse] = useState(false);

  useAllClearEdge(() => {
    setPulse(true);

    const timer = setTimeout(() => setPulse(false), RING_PULSE_MS);

    return () => clearTimeout(timer);
  });

  return (
    <div className={styles.header}>
      <div className={styles['top-row']}>
        <MachineSelect />
        <div className={styles.health}>
          <div className={classNames(styles.ring, { [styles['ring-done']]: pulse })}>
            <Progress
              format={() => `${health.ok}/${health.total}`}
              percent={health.total ? Math.round((health.ok / health.total) * 100) : 0}
              size={48}
              strokeColor={health.allOk ? '#4fbb30' : '#1890ff'}
              type="circle"
            />
          </div>
          <div className={styles.caption}>{t.essential_health}</div>
        </div>
      </div>
      <div className={styles.legend}>
        <span className={styles.item}>
          <span className={classNames(shared.dot, styles.dotUpToDate)} />
          {t.legend.up_to_date}
        </span>
        <span className={styles.item}>
          <span className={classNames(shared.dot, styles.dotDueSoon)} />
          {t.legend.due_soon}
        </span>
        <span className={styles.item}>
          <span className={classNames(shared.dot, styles.dotOverdue)} />
          {t.legend.overdue}
        </span>
        <span className={styles.item}>
          <span className={shared.ess}>{t.essential}</span>
          {t.essential_hint}
        </span>
      </div>
      {!record && <div className={styles.intro}>{t.intro}</div>}
    </div>
  );
};

export default Header;
