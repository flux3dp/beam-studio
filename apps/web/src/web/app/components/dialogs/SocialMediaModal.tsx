import React, { Fragment, useMemo } from 'react';
import { Divider, Modal } from 'antd';
import { ExportOutlined } from '@ant-design/icons';

import browser from 'implementations/browser';
import i18n from 'helpers/i18n';
import useI18n from 'helpers/useI18n';

import styles from './SocialMediaModal.module.scss';

type TItem = {
  name: string;
  description: string;
  link: string;
  src: string;
};

const Item = ({ item }: { item: TItem }) => (
  <div className={styles.item}>
    <img src={item.src} width={200} height="auto" alt={item.name} />
    <div className={styles.description}>{item.description}</div>
    <div className={styles.name} onClick={() => browser.open(item.link)}>
      {item.name} <ExportOutlined />
    </div>
  </div>
);

interface Props {
  onClose: () => void;
}

const SocialMediaModal = ({ onClose }: Props): JSX.Element => {
  const {
    topbar: { menu: tMenu },
    social_media: t,
  } = useI18n();

  const items: TItem[] = useMemo(() => {
    const isTW = i18n.getActiveLang() === 'zh-tw';
    const langKey = isTW ? 'taiwan' : 'global';
    // Note: Update qrcode images and links at the same time
    return [
      {
        name: 'Instagram',
        description: t.instagram,
        link: isTW
          ? 'https://www.instagram.com/fluxinctaiwan/'
          : 'https://www.instagram.com/flux_inc/',
        src: `core-img/social-media/instagram-${langKey}.png`,
      },
      {
        name: 'Facebook',
        description: t.facebook,
        link: isTW ? 'https://www.facebook.com/flux3dp.tw' : 'https://www.facebook.com/flux3dp',
        src: `core-img/social-media/facebook-${langKey}.png`,
      },
      {
        name: 'YouTube',
        description: t.youtube,
        link: isTW ? 'https://www.youtube.com/@FLUXIncTaiwan' : 'https://www.youtube.com/@fluxinc',
        src: `core-img/social-media/youtube-${langKey}.png`,
      },
    ];
  }, [t]);

  return (
    <Modal
      open
      centered
      width={750}
      title={tMenu.follow_us}
      onCancel={onClose}
      onOk={onClose}
      cancelButtonProps={{ className: styles.hide }}
    >
      <div className={styles.container}>
        {items.map((item, index) => (
          <Fragment key={item.name}>
            {index > 0 && <Divider type="vertical" />}
            <Item item={item} />
          </Fragment>
        ))}
      </div>
    </Modal>
  );
};

export default SocialMediaModal;
