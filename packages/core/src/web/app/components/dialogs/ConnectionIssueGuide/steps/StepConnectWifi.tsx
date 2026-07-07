import React, { useMemo } from 'react';

import { match } from 'ts-pattern';

import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import i18n from '@core/helpers/i18n';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';

import styles from './StepConnectWifi.module.scss';

interface StepConnectWifiProps {
  model: WorkAreaModel;
}

// Same for all articles, maybe because new articles are created by copying old ones, and the anchors are not updated.
const anchors = {
  cantFindHotspot: 'h_01HBWSS5H2P2C2PAZDHJ1N96AQ',
  dontKnowHotspotName: 'h_01HBWV06CR4W4SN8WRXCSN7Z7S',
} as const;

const getSupportUrl = (model: WorkAreaModel, anchorKey: keyof typeof anchors): string => {
  const locale = i18n.getActiveLang() === 'zh-tw' ? 'zh-tw' : 'en-us';
  const articleId = match<WorkAreaModel, string>(model)
    .with('fbm1', () => '4405448530831')
    .with('fbb1b', 'fbb1p', () => '9942201948559')
    .with('fhexa1', () => '4410633391759')
    .with('ado1', () => '7685514782607')
    .with('fbm2', () => '13277063972367')
    // use nx machine link (fbb2, fhx2rf) as default fallback for unknown new models
    .otherwise(() => '11032471153039');

  return `https://support.flux3dp.com/hc/${locale}/articles/${articleId}#${anchors[anchorKey]}`;
};

const StepConnectWifi = ({ model }: StepConnectWifiProps): React.JSX.Element => {
  const lang = useI18n().connection_issue_guide.connect_wifi;
  const imageUrls = useMemo(() => {
    const suffix = match<WorkAreaModel, string>(model)
      .with('fbm1', 'fbb1b', 'fbb1p', 'fhexa1', () => 'classic')
      .with('ado1', () => 'ador')
      .otherwise(() => 'nx');

    return [1, 2, 3, 4].map((i) => `core-img/connection-issue-guide/connect-${i}-${suffix}.png`);
  }, [model]);

  return (
    <div className={styles.column}>
      <div className={styles.scrollable}>
        <div className={styles.title}>{lang.title}</div>
        <div className={styles.content}>
          <div>{lang.step1}</div>
          <div>{lang.step2}</div>
          <div>{lang.step3}</div>
        </div>
        <div className={styles.links}>
          <a onClick={() => browser.open(getSupportUrl(model, 'cantFindHotspot'))}>{lang.cant_find_hotspot}</a>
          <a onClick={() => browser.open(getSupportUrl(model, 'dontKnowHotspotName'))}>{lang.dont_know_hotspot_name}</a>
        </div>
        <div className={styles.imageRow}>
          {imageUrls.map((src) => (
            <img draggable="false" key={src} src={src} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default StepConnectWifi;
