import React, { useMemo } from 'react';

import { match } from 'ts-pattern';

import { nxModelsArray } from '@core/app/actions/beambox/constant';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import i18n from '@core/helpers/i18n';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';

import styles from './StepConnectWifi.module.scss';

interface StepConnectWifiProps {
  model: WorkAreaModel;
}

const getSupportUrl = (anchor: string): string => {
  const locale = i18n.getActiveLang() === 'zh-tw' ? 'zh-tw' : 'en-us';

  return `https://support.flux3dp.com/hc/${locale}/articles/4410633391759#${anchor}`;
};

const StepConnectWifi = ({ model }: StepConnectWifiProps): React.JSX.Element => {
  const lang = useI18n().connection_issue_guide.connect_wifi;
  const imageUrls = useMemo(() => {
    const suffix = match<WorkAreaModel, string>(model)
      .with('ado1', () => 'ador')
      .with(...nxModelsArray, () => 'nx')
      .otherwise(() => 'classic');

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
          <a onClick={() => browser.open(getSupportUrl('h_01HBWS9MYZ51T9KZTMVC6ZM6E6'))}>{lang.cant_find_hotspot}</a>
          <a onClick={() => browser.open(getSupportUrl('h_01HBWV06CR4W4SN8WRXCSN7Z7S'))}>
            {lang.dont_know_hotspot_name}
          </a>
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
