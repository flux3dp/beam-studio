import React, { useEffect, useState } from 'react';

import type Cropper from 'cropperjs';

import BeamboxStore from '@core/app/stores/beambox-store';

import StepCrop from './StepCrop';
import StepTune from './StepTune';

enum Step {
  CROP = 1,
  NONE = 0,
  TUNE = 2,
}

const ImageTracePanel = (): React.JSX.Element => {
  const [step, setStep] = useState(Step.NONE);
  const [cropResult, setCropResult] = useState<{ data: Cropper.Data; url: string }>(null);

  useEffect(() => {
    const handleStart = () => setStep((prev) => (prev === Step.NONE ? Step.CROP : prev));

    BeamboxStore.onCropperShown(handleStart);

    return () => {
      BeamboxStore.removeCropperShownListener(handleStart);
    };
  }, []);

  if (step === Step.CROP) {
    const onFinish = (data: Cropper.Data, url: string) => {
      setCropResult({ data, url });
      setStep(Step.TUNE);
    };

    return <StepCrop onCancel={() => setStep(Step.NONE)} onCropFinish={onFinish} />;
  }

  if (step === Step.TUNE) {
    const { data, url } = cropResult;
    const handleGoBack = () => {
      URL.revokeObjectURL(url);
      setStep(Step.CROP);
    };

    return <StepTune cropData={data} imageUrl={url} onClose={() => setStep(Step.NONE)} onGoBack={handleGoBack} />;
  }

  return null;
};

export default ImageTracePanel;
