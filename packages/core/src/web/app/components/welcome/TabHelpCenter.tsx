import { useMemo } from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import classNames from 'classnames';

import GridGuide from '@core/app/components/welcome/GridGuide';
import { checkBM2 } from '@core/helpers/checkFeature';
import { mockT } from '@core/helpers/dev-helper';
import i18n from '@core/helpers/i18n';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';

import styles from './TabHelpCenter.module.scss';
import ThemedButton from './ThemedButton';

const guides = [
  checkBM2()
    ? {
        category: 13025863120655,
        name: mockT('beamo II Guide'),
        src: 'core-img/init-panel/beamo2-real.webp',
      }
    : null,
  {
    category: 10647778378639,
    name: mockT('Beambox II Guide'),
    src: 'core-img/init-panel/beambox-2-real.png',
  },
  {
    category: 10552359659535,
    name: mockT('Promark Guide'),
    src: 'core-img/init-panel/promark-series-real.png',
  },
  {
    category: 7104732498447,
    name: mockT('Ador Guide'),
    src: 'core-img/init-panel/ador-real.png',
  },
  {
    category: 360000108616,
    name: mockT('beamo Guide'),
    src: 'core-img/init-panel/beamo-real.webp',
  },
  {
    category: 360000121176,
    name: mockT('Beambox (Pro) Guide'),
    src: 'core-img/init-panel/beambox-pro-real.png',
  },
  {
    category: 4406510807823,
    name: mockT('HEXA Guide'),
    src: 'core-img/init-panel/hexa-real.png',
  },
  {
    category: 360000142376,
    name: mockT('Beam Air Guide'),
    src: 'core-img/init-panel/beam-air-real.png',
  },
  {
    category: 9071046535567,
    name: mockT('Beam Air Pro Guide'),
    src: 'core-img/init-panel/beam-air-pro-real.png',
  },
  {
    category: 360000126835,
    name: mockT('Beam Studio Guide'),
    src: 'core-img/BeamStudio-logo.png',
  },
];

const TabHelpCenter = () => {
  const {
    topbar: { menu: tMenu },
  } = useI18n();
  const helpCenterUrl = useMemo(() => {
    const isZhTw = i18n.getActiveLang() === 'zh-tw';

    return isZhTw ? 'https://support.flux3dp.com/hc/zh-tw' : 'https://support.flux3dp.com/hc/en-us';
  }, []);

  return (
    <div>
      <div className={styles.title}>
        <QuestionCircleOutlined /> {tMenu.help_center}
      </div>
      <div className={styles.subtitle}>{mockT('Guides, manuals, and support resources for all things FLUX.')}</div>
      <div className={classNames(styles.content, styles.buttons)}>
        <ThemedButton onClick={() => browser.open(helpCenterUrl)} theme="yellow">
          {mockT('Visit Help Center')}
        </ThemedButton>
        <ThemedButton onClick={() => browser.open(`${helpCenterUrl}/requests/new`)} theme="black">
          {mockT('Submit a Request')}
        </ThemedButton>
      </div>
      <div className={styles.title}>{mockT('Guides')}</div>
      <div className={styles.subtitle}>{mockT('View comprehensive guides for all FLUX products.')}</div>
      <div className={classNames(styles.content, styles.guides)}>
        {guides.map((guide) => guide && <GridGuide baseUrl={helpCenterUrl} guide={guide} key={guide.category} />)}
      </div>
    </div>
  );
};

export default TabHelpCenter;
