import { getOS } from '@core/helpers/getOS';
import i18n from '@core/helpers/i18n';

import Alert from '../app/actions/alert-caller';
import Progress from '../app/actions/progress-caller';
import AlertConstants from '../app/constants/alert-constants';

export default {
  uploadToS3: async (fileName: string, body: string) => {
    const t = i18n.lang.beambox.popup;

    if (body.length > 10000000) {
      // 10M
      setTimeout(() => {
        Alert.popUp({
          message: t.upload_file_too_large,
          type: AlertConstants.SHOW_POPUP_ERROR,
        });
      }, 100);

      return;
    }

    Progress.openNonstopProgress({ id: 'upload-to-aws', message: t.progress.uploading });

    try {
      const reportFile = new Blob([body], { type: 'application/octet-stream' });
      // reportFile.lastModifiedDate = new Date();
      const reportName = `${Math.floor(Date.now() / 1000)}-${fileName}-${getOS()}-v${
        window['FLUX'].version
      }-${fileName}`;

      const uploadFormData = new FormData();

      uploadFormData.append('file', reportFile);
      uploadFormData.append('Content-Type', reportFile.type);
      uploadFormData.append('acl', 'bucket-owner-full-control');
      uploadFormData.append('key', `svg&bvg/${reportName}`);

      const url = `https://beamstudio-bug-report.s3.amazonaws.com/svg&bvg/reportName`;
      const config = {
        body: uploadFormData,
        headers: new Headers({
          Accept: 'application/xml',
          'Content-Type': 'multipart/form-data',
        }),
        method: 'PUT',
      };
      let r = await fetch(url, config);

      if (r.status === 200) {
        console.log('Success', r);
        Alert.popUp({
          message: t.successfully_uploaded,
          type: AlertConstants.SHOW_POPUP_INFO,
        });
      } else {
        console.log('Failed', r);
        Alert.popUp({
          message: `${t.upload_failed}\n${r.status}`,
          type: AlertConstants.SHOW_POPUP_ERROR,
        });
      }
    } catch (e) {
      console.log(e);
      Alert.popUp({
        message: `${t.upload_failed}\n${e}`,
        type: AlertConstants.SHOW_POPUP_ERROR,
      });
    } finally {
      Progress.popById('upload-to-aws');
    }
  },
};
