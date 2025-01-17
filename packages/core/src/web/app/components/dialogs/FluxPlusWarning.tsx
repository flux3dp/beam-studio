import React from 'react';
import { Button } from 'antd';

import browser from 'implementations/browser';
import dialogCaller from 'app/actions/dialog-caller';
import FluxIcons from 'app/icons/flux/FluxIcons';
import useI18n from 'helpers/useI18n';
import { getCurrentUser } from 'helpers/api/flux-id';

import FluxPlusModal from './FluxPlusModal';
import styles from './FluxPlusWarning.module.scss';

interface Props {
  onClose: () => void;
  monotype?: boolean;
}

const FluxPlusWarning = ({ onClose, monotype = false }: Props): JSX.Element => {
  const lang = useI18n().flux_id_login;
  const user = getCurrentUser();
  const note = monotype
    ? lang.flux_plus.access_monotype_feature_note
    : lang.flux_plus.access_plus_feature_note;

  return (
    <FluxPlusModal onClose={onClose}>
      <div className={styles['flux-plus']}>
        <img src="core-img/flux-plus/man-guess.jpg" alt={note} />
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
          <Button
            block
            type="primary"
            onClick={() => browser.open(lang.flux_plus.member_center_url)}
          >
            {monotype ? lang.flux_plus.get_addon : lang.flux_plus.subscribe_now}
          </Button>
          {!user && (
            <Button
              block
              type="default"
              onClick={() => {
                onClose();
                dialogCaller.showLoginDialog();
              }}
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
