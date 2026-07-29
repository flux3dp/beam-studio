import React from 'react';

import { AimOutlined, RedoOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useShallow } from 'zustand/react/shallow';

import alertCaller from '@core/app/actions/alert-caller';
import useI18n from '@core/helpers/useI18n';

import { clearPrintAndCutConfig } from '../configStore';
import styles from '../index.module.scss';
import { usePrintAndCutStore } from '../store';
import { collectCanvasContents } from '../utils/collectContents';
import { clearRasterCache } from '../utils/computeCutPathD';

const StepResume = (): React.JSX.Element => {
  const lang = useI18n().print_and_cut;
  const { init, setStep } = usePrintAndCutStore(useShallow(({ init, setStep }) => ({ init, setStep })));

  const handleStartOver = () => {
    const contents = collectCanvasContents();

    // the design layers may still be hidden from the previous run; there is
    // nothing to reconfigure until the user restores them (undo the finish)
    if (contents.elements.length === 0) {
      alertCaller.popUp({ message: lang.no_content });

      return;
    }

    clearRasterCache();
    clearPrintAndCutConfig();
    init(contents);
  };

  return (
    <div className={styles.content}>
      <div className={styles.desc}>{lang.resume_desc}</div>
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
