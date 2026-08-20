import React, { useEffect, useState } from 'react';

import { match, P } from 'ts-pattern';

import formatDuration from '@core/helpers/duration-formatter';
import useI18n from '@core/helpers/useI18n';

import styles from '../index.module.scss';
import type { AlignPhase } from '../utils/alignProgress';

interface RemainingTimeProps {
  phase: AlignPhase;
  /** Latest phase estimate; null while none is available (shows "Calculating") */
  remainingSeconds: null | number;
}

const RemainingTime = ({ phase, remainingSeconds }: RemainingTimeProps): React.JSX.Element => {
  const { message: tMessage, print_and_cut: t } = useI18n();
  // countdown shown between progress reports: restarts from every new estimate,
  // ticks down locally once per second in between (floored at 1 — the estimate
  // is rough and formatDuration(0) renders empty)
  const [countdownSeconds, setCountdownSeconds] = useState<null | number>(null);

  useEffect(() => {
    setCountdownSeconds(remainingSeconds);

    if (remainingSeconds === null) return undefined;

    const timer = setInterval(
      () => setCountdownSeconds((prev) => (prev === null ? null : Math.max(1, prev - 1))),
      1000,
    );

    return () => clearInterval(timer);
  }, [remainingSeconds]);

  // the wrap-up phase has nothing left to count, so it states that instead of a time
  const value = match({ countdownSeconds, phase })
    .with({ phase: 'completing' }, () => t.align_progress.completing)
    .with({ countdownSeconds: P.number }, ({ countdownSeconds }) => formatDuration(countdownSeconds))
    .otherwise(() => t.align_progress.calculating);

  return (
    <div className={`${styles.desc} ${styles.timeRemaining}`}>
      <span>{tMessage.time_remaining}</span>
      <span>{value}</span>
    </div>
  );
};

export default RemainingTime;
