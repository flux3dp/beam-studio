import alertCaller from '@core/app/actions/alert-caller';
import progressCaller from '@core/app/actions/progress-caller';
import currentFileManager from '@core/app/svgedit/currentFileManager';
import beamFileHelper from '@core/helpers/beam-file-helper';

export const resetTemplate = async () => {
  const modalId = 'reset-template';

  const blob = currentFileManager.templateFileBlob;

  if (!blob) return;

  progressCaller.openNonstopProgress({ id: modalId });

  try {
    await beamFileHelper.readBeam(blob as File);
  } catch (error) {
    // Never leave the non-stop progress overlay stuck if re-reading the retained template fails.
    console.error('Failed to reset template', error);
    alertCaller.popUpError({ message: String((error as Error)?.message ?? error) });
  } finally {
    progressCaller.popById(modalId);
  }
};
