import alertCaller from '@core/app/actions/alert-caller';
import alertConstants from '@core/app/constants/alert-constants';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import i18n from '@core/helpers/i18n';
import type { GlobalPreference } from '@core/interfaces/Preference';

const showUpdateFontConvertDialog = async (isNewUser: boolean): Promise<void> => {
  if (isNewUser) {
    return;
  }

  const globalPreference = useGlobalPreferenceStore.getState();

  if (globalPreference['font-convert']) {
    return;
  }

  const t = i18n.lang.beambox.popup.text_to_path;

  const result = await new Promise<GlobalPreference['font-convert']>((resolve) => {
    alertCaller.popUp({
      buttonType: alertConstants.YES_NO,
      caption: t.caption,
      links: [
        {
          text: i18n.lang.alert.learn_more,
          url: i18n.lang.settings.help_center_urls.font_convert,
        },
      ],
      message: t.message,
      onNo: () => resolve('1.0'),
      onYes: () => resolve('2.0'),
    });
  });

  globalPreference.set('font-convert', result);
};

export default showUpdateFontConvertDialog;
