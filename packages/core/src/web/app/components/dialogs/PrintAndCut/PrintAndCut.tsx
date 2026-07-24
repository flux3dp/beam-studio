import React, { useEffect } from 'react';

import { Button } from 'antd';
import { match } from 'ts-pattern';
import { useShallow } from 'zustand/react/shallow';

import BackButton from '@core/app/widgets/FullWindowPanel/BackButton';
import FullWindowPanel from '@core/app/widgets/FullWindowPanel/FullWindowPanel';
import Header from '@core/app/widgets/FullWindowPanel/Header';
import Sider from '@core/app/widgets/FullWindowPanel/Sider';
import useNewShortcutsScope from '@core/helpers/hooks/useNewShortcutsScope';
import useI18n from '@core/helpers/useI18n';

import Canvas from './Canvas';
import { printAndCutSteps } from './constants';
import styles from './index.module.scss';
import StepAlign from './steps/StepAlign';
import StepExport from './steps/StepExport';
import StepPaper from './steps/StepPaper';
import StepSetup from './steps/StepSetup';
import { usePrintAndCutStore } from './store';
import { generateAlignedCutLayer } from './utils/generateCutLayer';

interface Props {
  onClose: () => void;
}

const PrintAndCut = ({ onClose }: Props): React.JSX.Element => {
  useNewShortcutsScope();

  const { buttons: tButtons, print_and_cut: t } = useI18n();
  const { nextStep, prevStep, reset, step } = usePrintAndCutStore(
    useShallow(({ nextStep, prevStep, reset, step }) => ({ nextStep, prevStep, reset, step })),
  );

  useEffect(() => reset, [reset]);

  const handleFinish = () => {
    generateAlignedCutLayer();
    onClose();
  };

  const stepIndex = printAndCutSteps.indexOf(step);
  const stepTitles = [t.step_setup, t.step_paper, t.step_export, t.step_align];

  return (
    <FullWindowPanel
      mobileTitle={t.title}
      onClose={onClose}
      renderContents={() => (
        <>
          <Sider className={styles.sider}>
            <BackButton onClose={onClose}>{tButtons.back_to_beam_studio}</BackButton>
            <Header title={t.title} />
            <div className={styles.step}>
              <div className={styles.progress}>{`Step ${stepIndex + 1} / ${printAndCutSteps.length}`}</div>
              <div className={styles.title}>{stepTitles[stepIndex]}</div>
            </div>
            {match(step)
              .with('setup', () => <StepSetup />)
              .with('paper', () => <StepPaper />)
              .with('export', () => <StepExport />)
              .with('align', () => <StepAlign />)
              .exhaustive()}
            <div className={styles.footer}>
              {stepIndex > 0 && <Button onClick={prevStep}>{tButtons.back}</Button>}
              {step === 'align' ? (
                <Button onClick={handleFinish} type="primary">
                  {t.finish}
                </Button>
              ) : (
                <Button onClick={nextStep} type="primary">
                  {tButtons.next}
                </Button>
              )}
            </div>
          </Sider>
          <Canvas />
        </>
      )}
    />
  );
};

export default PrintAndCut;
