import { QuestionCircleOutlined } from '@ant-design/icons';
import classNames from 'classnames';

import GridGuide from '@core/app/components/welcome/GridGuide';

import styles from './TabHelpCenter.module.scss';
import ThemedButton from './ThemedButton';

const guides = [
  {
    category: 10647778378639,
    name: 'Beambox II Guide',
    src: 'core-img/init-panel/beambox-2-real.png',
  },
  {
    category: 10647778378639,
    name: 'Promark Guide',
    src: 'core-img/init-panel/promark-series-real.png',
  },
  {
    category: 10647778378639,
    name: 'Ador Guide',
    src: 'core-img/init-panel/ador-real.png',
  },
  {
    category: 10647778378639,
    name: 'beamo Guide',
    src: 'core-img/init-panel/beamo-real.png',
  },
  {
    category: 10647778378639,
    name: 'Beambox (Pro) Guide',
    src: 'core-img/init-panel/beambox-pro-real.png',
  },
  {
    category: 10647778378639,
    name: 'HEXA Guide',
    src: 'core-img/init-panel/hexa-real.png',
  },
  {
    category: 10647778378639,
    name: 'Beam Air Guide',
    src: 'core-img/init-panel/beam-air-real.png',
  },
  {
    category: 10647778378639,
    name: 'Beam Air Pro Guide',
    src: 'core-img/init-panel/beam-air-pro-real.png',
  },
  {
    category: 10647778378639,
    name: 'Beam Studio Guide',
    src: 'core-img/init-panel/beambox-2-real.png',
  },
];

const TabHelpCenter = () => {
  return (
    <div>
      <div className={styles.title}>
        <QuestionCircleOutlined /> Help Center
      </div>
      <div className={styles.subtitle}>Guides, manuals, and support resources for all things FLUX.</div>
      <div className={classNames(styles.content, styles.buttons)}>
        <ThemedButton theme="yellow">Visit Help Center</ThemedButton>
        <ThemedButton theme="black">Submit a Request</ThemedButton>
      </div>
      {/* <div className={styles.title}>Beami, Your AI Assistant</div>
      <div className={styles.subtitle}>
        I can answer your questions about FLUX laser cutters, troubleshooting, and Beam Studio!
      </div>
      <div className={styles.content}>
        <ConfigProvider
          theme={{
            components: { Button: { fontWeight: 700 } },
            token: { controlHeight: 48, fontSize: 16 },
          }}
        >
          <Button className={styles.gradient} type="primary">
            Ask Beami a Question
          </Button>
        </ConfigProvider>
      </div> */}
      <div className={styles.title}>Guides</div>
      <div className={styles.subtitle}>View comprehensive guides for all FLUX products.</div>
      <div className={classNames(styles.content, styles.grids)}>
        {guides.map((guide) => (
          <GridGuide guide={guide} key={guide.category} />
        ))}
      </div>
    </div>
  );
};

export default TabHelpCenter;
