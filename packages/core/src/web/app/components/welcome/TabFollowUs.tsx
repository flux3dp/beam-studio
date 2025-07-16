import { FacebookOutlined, LikeOutlined, LinkedinOutlined, PinterestFilled } from '@ant-design/icons';
import { Button } from 'antd';

import { getSocialMedia } from '@core/app/constants/social-media-constants';
import { mockT } from '@core/helpers/dev-helper';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';

import styles from './TabFollowUs.module.scss';

const TabFollowUs = () => {
  const {
    topbar: { menu: t },
  } = useI18n();
  const socialMedia = getSocialMedia();

  return (
    <div>
      <div className={styles.title}>
        <LikeOutlined /> {t.follow_us}
      </div>
      <div className={styles.subtitle}>{mockT('Get inspirations, deals, freebies and engage with FLUXers!')}</div>
      <div className={styles.content}>
        <div className={styles.imgs}>
          <img onClick={() => browser.open(socialMedia.youtube.link)} src={socialMedia.youtube.subscribeSrc} />
          <img onClick={() => browser.open(socialMedia.instagram.link)} src={socialMedia.instagram.subscribeSrc} />
        </div>
        <div className={styles.buttons}>
          <Button
            icon={<FacebookOutlined className={styles.icon} />}
            onClick={() => browser.open(socialMedia.facebookGroup.link)}
            size="large"
          >
            {mockT('User Group')}
          </Button>
          <Button
            icon={<PinterestFilled className={styles.icon} />}
            onClick={() => browser.open(socialMedia.pinterest.link)}
            size="large"
          >
            Pinterest
          </Button>
          <Button
            icon={<LinkedinOutlined className={styles.icon} />}
            onClick={() => browser.open(socialMedia.linkedin.link)}
            size="large"
          >
            LinkedIn
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TabFollowUs;
