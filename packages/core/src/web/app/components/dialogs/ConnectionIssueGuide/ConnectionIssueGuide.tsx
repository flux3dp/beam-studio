import React, { useMemo, useState } from 'react';

import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import SetupPageLayout, {
  type SetupPageButtonConfig,
} from '@core/app/pages/InitializeMachine/Components/SetupPageLayout';
import useI18n from '@core/helpers/useI18n';

import type { ConnectionIssueResult } from './context';
import { ConnectionIssueGuideContext } from './context';
import { getConnectionIssueSteps } from './steps';
import StepFail from './steps/StepFail';
import StepSuccess from './steps/StepSuccess';

interface ConnectionIssueGuideProps {
  model: WorkAreaModel;
  onClose: () => void;
}

const ConnectionIssueGuide = ({ model, onClose }: ConnectionIssueGuideProps): React.JSX.Element => {
  const lang = useI18n().buttons;
  const [index, setIndex] = useState(0);
  const [primaryOverride, setPrimaryOverride] = useState<null | SetupPageButtonConfig>(null);
  const [result, setResult] = useState<ConnectionIssueResult | null>(null);
  const steps = useMemo(() => getConnectionIssueSteps(model), [model]);

  const isFirst = index === 0;
  const isLast = index === steps.length - 1;

  const goPrev = () => (isFirst ? onClose() : setIndex((prev) => prev - 1));
  const goNext = () => (isLast ? onClose() : setIndex((prev) => prev + 1));

  // Steps that override the primary button (e.g. StepVerify) reset it to null on unmount via context.
  const defaultPrimary: SetupPageButtonConfig = {
    label: isLast ? lang.done : lang.next,
    onClick: goNext,
    primary: true,
  };

  let content: React.ReactNode;
  let buttons: SetupPageButtonConfig[];

  if (result === 'success') {
    content = <StepSuccess />;
    buttons = [{ label: lang.done, onClick: onClose, primary: true }];
  } else if (result === 'fail') {
    content = <StepFail />;
    buttons = [
      { label: lang.back, onClick: () => setResult(null) },
      { label: lang.done, onClick: onClose, primary: true },
    ];
  } else {
    content = steps[index].content;
    buttons = [{ label: lang.back, onClick: goPrev }, primaryOverride ?? defaultPrimary];
  }

  return (
    <ConnectionIssueGuideContext value={{ setPrimaryButton: setPrimaryOverride, setResult }}>
      <SetupPageLayout buttons={buttons} isDialog>
        {content}
      </SetupPageLayout>
    </ConnectionIssueGuideContext>
  );
};

export default ConnectionIssueGuide;
