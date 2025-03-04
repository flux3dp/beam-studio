import React from 'react';

import { Button } from 'antd';

import Alert from '@core/app/actions/alert-caller';
import AlertConstants from '@core/app/constants/alert-constants';
import i18n from '@core/helpers/i18n';
import browser from '@core/implementations/browser';

import styles from './updateFontConvert.module.scss';

const updateFontConvert = (): Promise<'1.0' | '2.0'> => {
  const LANG = i18n.lang.beambox.popup.text_to_path;

  return new Promise<'1.0' | '2.0'>((resolve) => {
    Alert.popUp({
      buttonType: AlertConstants.YES_NO,
      caption: LANG.caption,
      message: (
        <div>
          <div className={styles.message}>{LANG.message}</div>
          <Button
            className={styles.button}
            onClick={() => browser.open(i18n.lang.settings.help_center_urls.font_convert)}
            type="link"
          >
            {i18n.lang.alert.learn_more}
          </Button>
        </div>
      ),
      onNo: () => resolve('1.0'),
      onYes: () => resolve('2.0'),
    });
  });
};

export default updateFontConvert;
