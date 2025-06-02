import alertCaller from '@core/app/actions/alert-caller';
import progressCaller from '@core/app/actions/progress-caller';
import alertConstants from '@core/app/constants/alert-constants';
import svgLaserParser from '@core/helpers/api/svg-laser-parser';
import awsHelper from '@core/helpers/aws-helper';
import type { ILang } from '@core/interfaces/ILang';
import type { ImportType } from '@core/interfaces/ImportSvg';

const svgWebSocket = svgLaserParser({ type: 'svgeditor' });

export async function uploadAndDivideSvg(
  file: Blob,
  importType: ImportType,
  lang: ILang,
): Promise<null | (Record<string, Blob> & { bitmapOffset?: [number, number] })> {
  const uploadResult = await svgWebSocket.uploadPlainSVG(file);

  if (uploadResult !== 'ok') {
    progressCaller.popById('loading_image');

    if (uploadResult === 'invalid_path') {
      alertCaller.popUpError({ message: lang.beambox.popup.import_file_contain_invalid_path });
    }

    return null;
  }

  const output = await svgWebSocket.divideSVG({ byLayer: importType === 'layer' });

  if (!output.res) {
    alertCaller.popUpError({
      buttonType: alertConstants.YES_NO,
      message: `#809 ${output.data}\n${lang.beambox.popup.import_file_error_ask_for_upload}`,
      onYes: () => {
        const fileReader = new FileReader();

        fileReader.onloadend = (e) => {
          const svgString = e.target?.result;

          awsHelper.uploadToS3(file.name, svgString);
        };

        fileReader.readAsText(file);
      },
    });

    return null;
  }

  return output.data;
}
