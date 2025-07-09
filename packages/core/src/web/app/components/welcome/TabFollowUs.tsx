import { FacebookOutlined, LikeOutlined, LinkedinOutlined, PinterestFilled } from '@ant-design/icons';
import { Button } from 'antd';

import { getSocialMedia } from '@core/app/constants/social-media-constants';
import { mockT, todo } from '@core/helpers/dev-helper';
import browser from '@core/implementations/browser';

import styles from './TabFollowUs.module.scss';

todo('subscribeSrc', 'add subscribeSrc for tw version');

const TabFollowUs = () => {
  const socialMedia = getSocialMedia();

  return (
    <div>
      <div className={styles.title}>
        <LikeOutlined /> {mockT('Follow Us')}
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
            onClick={() => todo('open Facebook User Group')}
            size="large"
          >
            {mockT('Facebook User Group')}
          </Button>
          <Button
            icon={<PinterestFilled className={styles.icon} />}
            onClick={() => todo('open Pinterest')}
            size="large"
          >
            {mockT('Pinterest')}
          </Button>
          <Button
            icon={<LinkedinOutlined className={styles.icon} />}
            onClick={() => todo('open LinkedIn')}
            size="large"
          >
            {mockT('LinkedIn')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TabFollowUs;
