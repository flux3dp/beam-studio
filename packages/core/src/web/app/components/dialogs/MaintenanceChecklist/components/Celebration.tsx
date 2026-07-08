import React, { useState } from 'react';

import { CheckCircleFilled } from '@ant-design/icons';
import { createPortal } from 'react-dom';
import { sprintf } from 'sprintf-js';

import { rainConfetti } from '@core/helpers/confetti';
import useI18n from '@core/helpers/useI18n';

import { useAllClearEdge } from '../useAllClearEdge';
import { useMaintenanceData } from '../useMaintenanceData';

import styles from './Celebration.module.scss';

const CELEBRATION_MS = 2300;

/** Machine-health celebration: confetti + a congratulatory card, respecting reduced-motion. */
const Celebration = (): null | React.JSX.Element => {
  const t = useI18n().maintenance.celebration;
  const { machineName } = useMaintenanceData();
  const [show, setShow] = useState(false);

  // Fire when the user completes the checklist (same-machine all-clear edge).
  useAllClearEdge(() => {
    setShow(true);
    rainConfetti();

    const timer = setTimeout(() => setShow(false), CELEBRATION_MS);

    return () => clearTimeout(timer);
  });

  if (!show) return null;

  return createPortal(
    <div className={styles.overlay}>
      <div className={styles.card}>
        <CheckCircleFilled className={styles.check} />
        <div className={styles.title}>{t.title}</div>
        <div className={styles.sub}>{sprintf(t.subtitle, machineName)}</div>
      </div>
    </div>,
    document.body,
  );
};

export default Celebration;
