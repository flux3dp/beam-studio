import { FacebookOutlined, LikeOutlined, LinkedinOutlined, PinterestFilled } from '@ant-design/icons';
import { Button } from 'antd';

import styles from './TabFollowUs.module.scss';

const TabFollowUs = () => {
  return (
    <div>
      <div className={styles.title}>
        <LikeOutlined /> Follow Us
      </div>
      <div className={styles.subtitle}>Get inspirations, deals, freebies and engage with FLUXers!</div>
      <div className={styles.content}>
        <div className={styles.imgs}>
          <div>
            <img src="https://s3-alpha-sig.figma.com/img/1da3/b73f/598ebe941cb7ede5560b57358c45cddf?Expires=1745193600&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=fMfsWyLaKaDMmaB-T1riqKIQwN-WzhNlRyDJZ7MPHaIgpooRHrROcMkH7KXuCXo4RSMUg5hFqvkY~WzylCcJsRv5-S4L9-qm3q-8Gtt3TLlg572~RF-wo1Xxr-esZ8i9Q4wxtK74vyE2nwlH~GzWYVHww6wtwV-JD7yTMWI4urIZVLSokwjVnpDbjjiV~IvfEZMUWN5E3d49gwtEwew8uQt1J1cELb6d7y6tLayN6oYscphPz79~~hLMG6tDWhgyefnkrpzNNzA89XhxijikNC60Z5ZoaSMAFWA~2QeBmnUZnITfwM822~tfTo00PYyPBmRmzuYqOFDGtPiSaqXfpw__" />
          </div>
          <div>
            <img src="https://s3-alpha-sig.figma.com/img/1da3/b73f/598ebe941cb7ede5560b57358c45cddf?Expires=1745193600&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=fMfsWyLaKaDMmaB-T1riqKIQwN-WzhNlRyDJZ7MPHaIgpooRHrROcMkH7KXuCXo4RSMUg5hFqvkY~WzylCcJsRv5-S4L9-qm3q-8Gtt3TLlg572~RF-wo1Xxr-esZ8i9Q4wxtK74vyE2nwlH~GzWYVHww6wtwV-JD7yTMWI4urIZVLSokwjVnpDbjjiV~IvfEZMUWN5E3d49gwtEwew8uQt1J1cELb6d7y6tLayN6oYscphPz79~~hLMG6tDWhgyefnkrpzNNzA89XhxijikNC60Z5ZoaSMAFWA~2QeBmnUZnITfwM822~tfTo00PYyPBmRmzuYqOFDGtPiSaqXfpw__" />
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
