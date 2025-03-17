import React, { useMemo } from 'react';

import classNames from 'classnames';
import { useLocation } from 'react-router-dom';

import type { SupportUsbModels } from '@core/app/actions/beambox/constant';
import useI18n from '@core/helpers/useI18n';

import styles from './ConnectUsb.module.scss';

export default function ConnectUsb(): React.JSX.Element {
  const { initialize: t } = useI18n();
  const { search } = useLocation();
  const model = useMemo(() => new URLSearchParams(search).get('model'), [search]) as SupportUsbModels;

  const renderInformation: Record<SupportUsbModels, { steps: string[]; title: string }> = {
    ado1: {
      steps: [
        t.connect_usb.turn_off_machine,
        t.connect_usb.tutorial1,
        t.connect_usb.turn_on_machine,
        t.connect_usb.wait_for_turning_on,
      ],
      title: 'Ador',
    },
    fbb2: {
      steps: [
        t.connect_usb.turn_off_machine,
        t.connect_usb.tutorial1,
        t.connect_usb.turn_on_machine,
        t.connect_usb.wait_for_turning_on,
      ],
      title: 'Beambox II',
    },
    fhexa1: {
      steps: [t.connect_usb.tutorial1, t.connect_usb.tutorial2],
      title: 'HEXA',
    },
    fpm1: {
      steps: [t.connect_usb.tutorial1, t.connect_usb.connect_camera, t.connect_usb.tutorial2],
      title: 'Promark Series',
    },
  };

  const handleNext = () => {
    const urlParams = new URLSearchParams({ model, usb: '1' });
    const queryString = urlParams.toString();

    window.location.hash = `#/initialize/connect/connect-machine-ip?${queryString}`;
  };

  const renderStep = (model: SupportUsbModels) =>
    model ? (
      <div className={classNames(styles.contents, styles.tutorial)}>
        <div className={styles.subtitle}>{renderInformation[model].title}</div>
        <div className={styles.contents}>
          {renderInformation[model].steps.map((step, index) => (
            <div key={`usb-step-${index + 1}`}>
              {index + 1}. {step}
            </div>
          ))}
        </div>
      </div>
    ) : null;

  return (
    <div className={styles.container}>
      <div className={styles['top-bar']} />
      <div className={styles.btns}>
        <div className={styles.btn} onClick={() => window.history.back()}>
          {t.back}
        </div>
        <div className={classNames(styles.btn, styles.primary)} onClick={handleNext}>
          {t.next}
        </div>
      </div>
      <div className={styles.main}>
        <div className={styles.image}>
          <div className={classNames(styles.circle, styles.c1)} />
          <img draggable="false" src="img/init-panel/icon-usb-cable.svg" />
          <div className={classNames(styles.circle, styles.c2)} />
        </div>
        <div className={styles.text}>
          <div className={styles.title}>{t.connect_usb.title}</div>
          {renderStep(model)}
        </div>
      </div>
    </div>
  );
}
