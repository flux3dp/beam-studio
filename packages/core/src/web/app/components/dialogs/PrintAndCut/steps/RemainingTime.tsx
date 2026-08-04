import React, { useEffect, useState } from 'react';

import formatDuration from '@core/helpers/duration-formatter';
import useI18n from '@core/helpers/useI18n';

import styles from '../index.module.scss';

interface RemainingTimeProps {
  /** Latest phase estimate; null while none is available (shows "Calculating") */
  remainingSeconds: null | number;
}

const RemainingTime = ({ remainingSeconds }: RemainingTimeProps): React.JSX.Element => {
  const { message: messageLang, print_and_cut: lang } = useI18n();
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

  return (
    <div className={`${styles.desc} ${styles.timeRemaining}`}>
      <span>{messageLang.time_remaining}</span>
      <span>{countdownSeconds === null ? lang.align_progress.calculating : formatDuration(countdownSeconds)}</span>
    </div>
  );
};

export default RemainingTime;
