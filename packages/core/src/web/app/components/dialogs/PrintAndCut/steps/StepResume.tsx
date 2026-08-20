import React from 'react';

import { AimOutlined, RedoOutlined } from '@ant-design/icons';
import { Alert, Button } from 'antd';
import { pick } from 'remeda';
import { useShallow } from 'zustand/react/shallow';

import { popDialogById } from '@core/app/actions/dialog-controller';
import useI18n from '@core/helpers/useI18n';

import { PRINT_AND_CUT_DIALOG_ID } from '../constants';
import styles from '../index.module.scss';
import { clearResumeConfig } from '../resumeConfigStore';
import { usePrintAndCutStore } from '../store';
import { startFreshRun } from '../utils/startFreshRun';

const StepResume = (): React.JSX.Element => {
  const lang = useI18n().print_and_cut;
  const { isPrintingContentsChanged, setStep } = usePrintAndCutStore(
    useShallow(pick(['isPrintingContentsChanged', 'setStep'])),
  );

  const handleStartOver = () => {
    // when the guard fails (preference off, no UV Print layer, or no content)
    // an alert explaining the fix is already shown; the fix happens in the
    // editor, so close the dialog but keep the saved configuration for resume
    if (startFreshRun()) clearResumeConfig();
    else popDialogById(PRINT_AND_CUT_DIALOG_ID);
  };

  return (
    <div className={styles.content}>
      <div className={styles.desc}>{lang.resume_desc}</div>
      {isPrintingContentsChanged && (
        <Alert className={styles.alert} message={lang.design_changed} showIcon type="warning" />
      )}
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
