import React from 'react';

import classNames from 'classnames';

import styles from './StepProgress.module.scss';

interface Props {
  className?: string;
  currentStep: number;
  steps: string[];
}

export const StepProgress = ({ className, currentStep, steps }: Props) => {
  if (steps.length === 0) return null;

  return (
    <div className={classNames(styles.container, className)}>
      {steps.map((step, idx) => (
        <div className={classNames(styles.step, { [styles.active]: idx <= currentStep })} key={step}>
          {step}
          <div className={styles.bar} />
        </div>
      ))}
    </div>
  );
};

export default StepProgress;
