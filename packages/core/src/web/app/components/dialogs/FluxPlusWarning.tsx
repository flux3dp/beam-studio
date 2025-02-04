import React from 'react';

import { Button } from 'antd';

import dialogCaller from '@core/app/actions/dialog-caller';
import FluxIcons from '@core/app/icons/flux/FluxIcons';
import { getCurrentUser } from '@core/helpers/api/flux-id';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';

import FluxPlusModal from './FluxPlusModal';
import styles from './FluxPlusWarning.module.scss';

interface Props {
  monotype?: boolean;
  onClose: () => void;
}

const FluxPlusWarning = ({ monotype = false, onClose }: Props): React.JSX.Element => {
  const lang = useI18n().flux_id_login;
  const user = getCurrentUser();
  const note = monotype ? lang.flux_plus.access_monotype_feature_note : lang.flux_plus.access_plus_feature_note;

  return (
    <FluxPlusModal onClose={onClose}>
      <div className={styles['flux-plus']}>
        <img alt={note} src="core-img/flux-plus/man-guess.jpg" />
        <div className={styles.text}>
          {monotype ? (
            lang.flux_plus.access_monotype_feature
          ) : (
            <>
              <div>{lang.flux_plus.access_plus_feature_1}</div>
              <FluxIcons.FluxPlusLogo />
              {lang.flux_plus.access_plus_feature_2}
            </>
          )}
        </div>
        <div className={styles.buttons}>
          <Button block onClick={() => browser.open(lang.flux_plus.member_center_url)} type="primary">
            {monotype ? lang.flux_plus.get_addon : lang.flux_plus.subscribe_now}
          </Button>
          {!user && (
            <Button
              block
              onClick={() => {
                onClose();
                dialogCaller.showLoginDialog();
              }}
              type="default"
            >
              {lang.login}
            </Button>
          )}
        </div>
        <div className={styles.note}>{note}</div>
      </div>
    </FluxPlusModal>
  );
};

export default FluxPlusWarning;
