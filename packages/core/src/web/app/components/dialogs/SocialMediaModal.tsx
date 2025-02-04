import React, { Fragment, useMemo } from 'react';

import { ExportOutlined } from '@ant-design/icons';
import { Divider, Modal } from 'antd';

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
  onClose: () => void;
}

const SocialMediaModal = ({ onClose }: Props): React.JSX.Element => {
  const {
    social_media: t,
    topbar: { menu: tMenu },
  } = useI18n();

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

  return (
    <Modal
      cancelButtonProps={{ className: styles.hide }}
      centered
      onCancel={onClose}
      onOk={onClose}
      open
      title={tMenu.follow_us}
      width={750}
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
