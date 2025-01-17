import React, { useEffect, useState } from 'react';
import Cropper from 'cropperjs';

import BeamboxStore from 'app/stores/beambox-store';
import StepCrop from 'app/views/beambox/ImageTracePanel/StepCrop';
import StepTune from 'app/views/beambox/ImageTracePanel/StepTune';

enum Step {
  NONE = 0,
  CROP = 1,
  TUNE = 2,
}

const ImageTracePanel = (): JSX.Element => {
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
    return <StepCrop onCropFinish={onFinish} onCancel={() => setStep(Step.NONE)} />;
  }
  if (step === Step.TUNE) {
    const { data, url } = cropResult;
    const handleGoBack = () => {
      URL.revokeObjectURL(url);
      setStep(Step.CROP);
    };
    return <StepTune cropData={data} imageUrl={url} onGoBack={handleGoBack} onClose={() => setStep(Step.NONE)} />;
  }

  return null;
};

export default ImageTracePanel;
