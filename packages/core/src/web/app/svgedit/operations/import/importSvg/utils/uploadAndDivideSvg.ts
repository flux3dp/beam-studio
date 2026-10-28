import alertCaller from '@core/app/actions/alert-caller';
import progressCaller from '@core/app/actions/progress-caller';
import svgLaserParser from '@core/helpers/api/svg-laser-parser';
import { withErrorReportConsent } from '@core/helpers/error-report/consent';
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
    alertCaller.popUpError(
      withErrorReportConsent(
        { message: `#809 ${output.data}` },
        {
          device: null,
          errorCode: '#809',
          scene: () => ({ content: file, name: file instanceof File ? file.name : 'import.svg' }),
        },
      ),
    );

    return null;
  }

  return output.data;
}
