import { getOS } from '@core/helpers/getOS';
import i18n from '@core/helpers/i18n';
import dialog from '@core/implementations/dialog';

export const downloadCalibrationFile = async (
  fileName: string,
  title: string = i18n.lang.calibration.download_calibration_pattern,
  defaultPath: string = 'Calibration Pattern',
): Promise<void> => {
  const ext = fileName.split('.').pop();
  const filter = ext
    ? [{ extensions: [ext], name: getOS() === 'MacOS' ? `${ext.toUpperCase()} (*.${ext})` : ext.toUpperCase() }]
    : undefined;

  dialog.writeFileDialog(
    async () => {
      const resp = await fetch(fileName);
      const blob = await resp.blob();

      return blob;
    },
    title,
    defaultPath,
    filter,
  );
};

export default downloadCalibrationFile;
