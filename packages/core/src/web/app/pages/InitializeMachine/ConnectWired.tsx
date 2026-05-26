import React, { useMemo } from 'react';

import { Collapse } from 'antd';
import classNames from 'classnames';
import { useSearchParams } from 'react-router';

import { adorModels, nxModels } from '@core/app/actions/beambox/constant';
import useI18n from '@core/helpers/useI18n';

import PanelImage, { adorNetworkHint, defaultNetworkHint, nxNetworkHint } from './Components/PanelImage';
import SetupPageLayout from './Components/SetupPageLayout';
import styles from './ConnectionPage.module.scss';

const ConnectWired = (): React.JSX.Element => {
  const lang = useI18n().initialize;
  const [searchParams] = useSearchParams();
  const [model, isAdor, isNx] = useMemo(() => {
    const model = searchParams.get('model') ?? '';

    return [model, adorModels.has(model), nxModels.has(model)];
  }, [searchParams]);

  const imageSrc = useMemo(() => {
    if (isAdor) {
      return 'core-img/init-panel/ador-network.jpg';
    }

    if (isNx) {
      return 'core-img/init-panel/beambox-2-panel.png';
    }

    return 'img/init-panel/touch-panel-en.jpg';
  }, [isAdor, isNx]);

  const hint = useMemo(() => {
    if (isAdor) return adorNetworkHint;

    if (isNx) return nxNetworkHint;

    return defaultNetworkHint;
  }, [isAdor, isNx]);

  const handleNext = () => {
    const urlParams = new URLSearchParams({ model, wired: '1' });
    const queryString = urlParams.toString();

    window.location.hash = `#/initialize/connect/connect-machine-ip?${queryString}`;
  };

  return (
    <SetupPageLayout
      buttons={[
        { label: lang.back, onClick: () => window.history.back() },
        { label: lang.next, onClick: handleNext, primary: true },
      ]}
    >
      <PanelImage hint={hint} landscape={isAdor} src={imageSrc} />
      <div className={classNames(styles.text, { [styles.ador]: isAdor })}>
        <div className={styles.title}>{lang.connect_wired.title}</div>
        <div className={classNames(styles.contents, styles.tutorial)}>
          <div>{lang.connect_wired.tutorial1}</div>
          <div>{isAdor ? lang.connect_wired.tutorial2_ador : lang.connect_wired.tutorial2}</div>
        </div>
        <Collapse
          accordion
          items={[
            {
              children: (
                <div className={classNames(styles.contents, styles.collapse)}>
                  {lang.connect_wired.what_if_1_content}
                </div>
              ),
              key: '1',
              label: lang.connect_wired.what_if_1,
            },
            {
              children: (
                <div className={classNames(styles.contents, styles.collapse)}>
                  {lang.connect_wired.what_if_2_content}
                </div>
              ),
              key: '2',
              label: lang.connect_wired.what_if_2,
            },
          ]}
        />
      </div>
    </SetupPageLayout>
  );
};

export default ConnectWired;
