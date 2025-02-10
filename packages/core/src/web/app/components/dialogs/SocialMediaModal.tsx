import React, { Fragment, useMemo, useState } from 'react';

import { ExportOutlined } from '@ant-design/icons';
import { Button, Checkbox, Divider, Modal } from 'antd';
import classNames from 'classnames';

import { getSocialMedia } from '@core/app/constants/social-media-constants';
import alertConfig from '@core/helpers/api/alert-config';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';

import styles from './SocialMediaModal.module.scss';

type TItem = {
  description: string;
  link: string;
  name: string;
  src: string;
};

const Item = ({ item }: { item: TItem }) => (
  <div className={styles.item}>
    <img alt={item.name} height="auto" src={item.src} width={200} />
    <div className={styles.description}>{item.description}</div>
    <div className={styles.name} onClick={() => browser.open(item.link)}>
      {item.name} <ExportOutlined />
    </div>
  </div>
);

interface Props {
  autoPopup?: boolean;
  onClose: () => void;
}

const SocialMediaModal = ({ autoPopup = false, onClose: closeModal }: Props): React.JSX.Element => {
  const {
    alert: tAlert,
    social_media: t,
    topbar: { menu: tMenu },
  } = useI18n();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const items: TItem[] = useMemo(() => {
    const socialMedia = getSocialMedia();

    return [
      { ...socialMedia.instagram, description: t.instagram },
      { ...socialMedia.facebook, description: t.facebook },
      { ...socialMedia.youtube, description: t.youtube },
    ];
  }, [t]);

  const onClose = () => {
    if (dontShowAgain) {
      alertConfig.write('skip-social-media-invitation', true);
    }

    closeModal();
  };

  return (
    <Modal centered footer={null} onCancel={onClose} open title={tMenu.follow_us} width={autoPopup ? 550 : 750}>
      <div className={classNames(styles.container, { [styles.small]: autoPopup })}>
        {items.map((item, index) => (
          <Fragment key={item.name}>
            {index > 0 && <Divider type="vertical" />}
            <Item item={item} />
          </Fragment>
        ))}
      </div>
      <div className={styles.footer}>
        {autoPopup && (
          <Checkbox onChange={() => setDontShowAgain(!dontShowAgain)} value={dontShowAgain}>
            {tAlert.dont_show_again}
          </Checkbox>
        )}
        <Button className={styles.button} onClick={onClose}>
          {tAlert.close}
        </Button>
      </div>
    </Modal>
  );
};

export default SocialMediaModal;
