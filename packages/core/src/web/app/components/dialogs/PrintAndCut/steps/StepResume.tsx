import React from 'react';

import { AimOutlined, RedoOutlined } from '@ant-design/icons';
import { Alert, Button } from 'antd';
import { useShallow } from 'zustand/react/shallow';

import useI18n from '@core/helpers/useI18n';

import styles from '../index.module.scss';
import { clearResumeConfig } from '../resumeConfigStore';
import { usePrintAndCutStore } from '../store';
import { startFreshRun } from '../utils/startFreshRun';

const StepResume = (): React.JSX.Element => {
  const lang = useI18n().print_and_cut;
  const { isPrintingContentsChanged, setStep } = usePrintAndCutStore(
    useShallow(({ isPrintingContentsChanged, setStep }) => ({ isPrintingContentsChanged, setStep })),
  );

  const handleStartOver = () => {
    // the guard fails while the design layers are still hidden from the
    // previous run; there is nothing to reconfigure until the user restores
    // them (undo the finish), so the saved configuration is kept
    if (startFreshRun()) clearResumeConfig();
  };

  return (
    <div className={styles.content}>
      <div className={styles.desc}>{lang.resume_desc}</div>
      {isPrintingContentsChanged && <Alert message={lang.design_changed} showIcon type="warning" />}
      <Button block icon={<AimOutlined />} onClick={() => setStep('align')} type="primary">
        {lang.continue_to_alignment}
      </Button>
      <Button block icon={<RedoOutlined />} onClick={handleStartOver}>
        {lang.start_over}
      </Button>
    </div>
  );
};

export default StepResume;
