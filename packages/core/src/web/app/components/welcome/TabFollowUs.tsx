import { FacebookOutlined, LikeOutlined, LinkedinOutlined, PinterestFilled } from '@ant-design/icons';
import { Button } from 'antd';

import { getSocialMedia } from '@core/app/constants/social-media-constants';
import browser from '@core/implementations/browser';

import styles from './TabFollowUs.module.scss';

const TabFollowUs = () => {
  const socialMedia = getSocialMedia();

  return (
    <div>
      <div className={styles.title}>
        <LikeOutlined /> Follow Us
      </div>
      <div className={styles.subtitle}>Get inspirations, deals, freebies and engage with FLUXers!</div>
      <div className={styles.content}>
        <div className={styles.imgs}>
          <div onClick={() => browser.open(socialMedia.youtube.link)}>
            <img src={socialMedia.youtube.subscribeSrc} />
          </div>
          <div onClick={() => browser.open(socialMedia.instagram.link)}>
            <img src={socialMedia.instagram.subscribeSrc} />
          </div>
        </div>
        <div className={styles.buttons}>
          <Button icon={<FacebookOutlined className={styles.icon} />} size="large">
            Facebook User Group
          </Button>
          <Button icon={<PinterestFilled className={styles.icon} />} size="large">
            Pinterest
          </Button>
          <Button icon={<LinkedinOutlined className={styles.icon} />} size="large">
            LinkedIn
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TabFollowUs;
