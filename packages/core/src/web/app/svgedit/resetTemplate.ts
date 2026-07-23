import progressCaller from '@core/app/actions/progress-caller';
import currentFileManager from '@core/app/svgedit/currentFileManager';
import beamFileHelper from '@core/helpers/beam-file-helper';

export const resetTemplate = async () => {
  const modelId = 'reset-template';

  const blob = currentFileManager.templateFileBlob;

  if (blob) {
    progressCaller.openNonstopProgress({ id: modelId });
    await beamFileHelper.readBeam(blob as File);
    progressCaller.popById(modelId);
  }
};
