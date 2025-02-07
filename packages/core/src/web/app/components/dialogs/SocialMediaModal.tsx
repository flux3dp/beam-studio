import React, { Fragment, useMemo, useState } from 'react';

import { ExportOutlined } from '@ant-design/icons';
import { Button, Checkbox, Divider, Modal } from 'antd';
import classNames from 'classnames';

import alertConfig from '@core/helpers/api/alert-config';
import i18n from '@core/helpers/i18n';
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
  const [dontShow, setDontShow] = useState(false);

  const items: TItem[] = useMemo(() => {
    const isTW = i18n.getActiveLang() === 'zh-tw';
    const langKey = isTW ? 'taiwan' : 'global';

    // Note: Update qrcode images and links at the same time
    return [
      {
        description: t.instagram,
        link: isTW ? 'https://www.instagram.com/fluxinctaiwan/' : 'https://www.instagram.com/flux_inc/',
        name: 'Instagram',
        src: `core-img/social-media/instagram-${langKey}.png`,
      },
      {
        description: t.facebook,
        link: isTW ? 'https://www.facebook.com/flux3dp.tw' : 'https://www.facebook.com/flux3dp',
        name: 'Facebook',
        src: `core-img/social-media/facebook-${langKey}.png`,
      },
      {
        description: t.youtube,
        link: isTW ? 'https://www.youtube.com/@FLUXIncTaiwan' : 'https://www.youtube.com/@fluxinc',
        name: 'YouTube',
        src: `core-img/social-media/youtube-${langKey}.png`,
      },
    ];
  }, [t]);

  const onClose = () => {
    if (dontShow) {
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
          <Checkbox onChange={() => setDontShow(!dontShow)} value={dontShow}>
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
