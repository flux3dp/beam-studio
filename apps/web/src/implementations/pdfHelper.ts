import { PdfHelper } from 'core-interfaces/IPdfHelper';
import getUtilWS from 'helpers/api/utils-ws';
import i18n from 'helpers/i18n';

const lang = i18n.lang.beambox.popup.pdf2svg;

const pdfToSvgBlob = async (file: File) => {
  const utilWS = getUtilWS();
  try {
    const blob = await utilWS.pdfToSvgBlob(file);
    return { blob };
  } catch (error) {
    return { errorMessage: `${lang.error_when_converting_pdf}\n${error}` };
  }
};

export default {
  pdfToSvgBlob,
} as PdfHelper;
