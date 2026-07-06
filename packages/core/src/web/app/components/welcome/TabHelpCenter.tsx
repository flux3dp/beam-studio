import React, { useMemo } from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import classNames from 'classnames';

import GridGuide from '@core/app/components/welcome/GridGuide';
import { useStorageStore } from '@core/app/stores/storageStore';
import { checkBM2, checkHxRf } from '@core/helpers/checkFeature';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';

import styles from './TabHelpCenter.module.scss';
import ThemedButton from './ThemedButton';

// TODO: Can be merged into guides after en version release
const guidesForZhTwOnly = [
  checkHxRf() && {
    category: 14101381797647,
    name: 'HEXA RF',
    src: 'core-img/init-panel/hexa-rf-real.webp',
  },
  checkBM2() && {
    category: 13025863120655,
    name: 'beamo II',
    src: 'core-img/init-panel/beamo2-real.webp',
  },
];
const guides = [
  {
    category: 10647778378639,
    name: 'Beambox II',
    src: 'core-img/init-panel/beambox-2-real.png',
  },
  {
    category: 10552359659535,
    name: 'Promark',
    src: 'core-img/init-panel/promark-series-real.png',
  },
  {
    category: 7104732498447,
    name: 'Ador',
    src: 'core-img/init-panel/ador-real.png',
  },
  {
    category: 360000108616,
    name: 'beamo',
    src: 'core-img/init-panel/beamo-real.webp',
  },
  {
    category: 360000121176,
    name: 'Beambox (Pro)',
    src: 'core-img/init-panel/beambox-pro-real.png',
  },
  {
    category: 4406510807823,
    name: 'HEXA',
    src: 'core-img/init-panel/hexa-real.webp',
  },
  {
    category: 360000142376,
    name: 'Beam Air',
    src: 'core-img/init-panel/beam-air-real.png',
  },
  {
    category: 9071046535567,
    name: 'Beam Air Pro',
    src: 'core-img/init-panel/beam-air-pro-real.png',
  },
  {
    category: 360000126835,
    name: 'Beam Studio',
    src: 'core-img/BeamStudio-logo.png',
  },
].filter(Boolean);

const TabHelpCenter = () => {
  const {
    topbar: { menu: tMenu },
    welcome_page: { help_center: t },
  } = useI18n();
  const activeLang = useStorageStore((state) => state['active-lang']);
  const isZhTw = useMemo(() => activeLang === 'zh-tw', [activeLang]);
  const zhTwGuides = useMemo(() => (isZhTw ? guidesForZhTwOnly : []), [isZhTw]);
  const helpCenterUrl = useMemo(() => {
    return isZhTw ? 'https://support.flux3dp.com/hc/zh-tw' : 'https://support.flux3dp.com/hc/en-us';
  }, [isZhTw]);

  return (
    <div>
      <div className={styles.title}>
        <QuestionCircleOutlined /> {tMenu.help_center}
      </div>
      <div className={styles.subtitle}>{t.subtitle}</div>
      <div className={classNames(styles.content, styles.buttons)}>
        <ThemedButton onClick={() => browser.open(helpCenterUrl)} theme="yellow">
          {t.visit_help_center}
        </ThemedButton>
        <ThemedButton onClick={() => browser.open(`${helpCenterUrl}/requests/new`)} theme="black">
          {t.submit_request}
        </ThemedButton>
      </div>
      <div className={styles.title}>{t.guides}</div>
      <div className={styles.subtitle}>{t.guides_subtitle}</div>
      <div className={classNames(styles.content, styles.guides)}>
        {zhTwGuides.map((guide) => guide && <GridGuide baseUrl={helpCenterUrl} guide={guide} key={guide.category} />)}
        {guides.map((guide) => guide && <GridGuide baseUrl={helpCenterUrl} guide={guide} key={guide.category} />)}
      </div>
    </div>
  );
};

export default TabHelpCenter;
