import React from 'react';

import { AimOutlined, RedoOutlined } from '@ant-design/icons';
import { Alert, Button } from 'antd';

import { popDialogById } from '@core/app/actions/dialog-controller';
import useI18n from '@core/helpers/useI18n';

import { PRINT_AND_CUT_DIALOG_ID } from '../constants';
import styles from '../index.module.scss';
import { clearResumeConfig } from '../resumeConfigStore';
import { usePrintAndCutStore } from '../store';
import { startFreshRun } from '../utils/startFreshRun';

const StepResume = (): React.JSX.Element => {
  const { print_and_cut: t } = useI18n();
  const isPrintingContentsChanged = usePrintAndCutStore((state) => state.isPrintingContentsChanged);
  const setStep = usePrintAndCutStore((state) => state.setStep);

  const handleStartOver = () => {
    // when the guard fails (preference off, no UV Print layer, or no content)
    // an alert explaining the fix is already shown; the fix happens in the
    // editor, so close the dialog but keep the saved configuration for resume
    if (startFreshRun()) clearResumeConfig();
    else popDialogById(PRINT_AND_CUT_DIALOG_ID);
  };

  return (
    <div className={styles.content}>
      <div className={styles.desc}>{t.resume_desc}</div>
      {isPrintingContentsChanged && (
        <Alert className={styles.alert} message={t.design_changed} showIcon type="warning" />
      )}
      <Button block icon={<AimOutlined />} onClick={() => setStep('align')} type="primary">
        {t.continue_to_alignment}
      </Button>
      <Button block icon={<RedoOutlined />} onClick={handleStartOver}>
        {t.start_over}
      </Button>
    </div>
  );
};

export default StepResume;
