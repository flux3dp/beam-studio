/* eslint-disable @typescript-eslint/no-shadow */
import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import classNames from 'classnames';

import useI18n from 'helpers/useI18n';

import { SupportUsbModels } from 'app/actions/beambox/constant';
import styles from './ConnectUsb.module.scss';

export default function ConnectUsb(): JSX.Element {
  const { initialize: t } = useI18n();
  const { search } = useLocation();
  const model = useMemo(
    () => new URLSearchParams(search).get('model'),
    [search]
  ) as SupportUsbModels;

  const renderInformation: Record<SupportUsbModels, { title: string; steps: Array<string> }> = {
    ado1: {
      title: 'Ador',
      steps: [
        t.connect_usb.turn_off_machine,
        t.connect_usb.tutorial1,
        t.connect_usb.turn_on_machine,
        t.connect_usb.wait_for_turning_on,
      ],
    },
    fhexa1: {
      title: 'HEXA',
      steps: [t.connect_usb.tutorial1, t.connect_usb.tutorial2],
    },
    fpm1: {
      title: 'Promark Series',
      steps: [t.connect_usb.tutorial1, t.connect_usb.connect_camera, t.connect_usb.tutorial2],
    },
    fbb2: {
      title: 'Beambox II',
      steps: [
        t.connect_usb.turn_off_machine,
        t.connect_usb.tutorial1,
        t.connect_usb.turn_on_machine,
        t.connect_usb.wait_for_turning_on,
      ],
    },
  };

  const handleNext = () => {
    const urlParams = new URLSearchParams({ model, usb: '1' });
    const queryString = urlParams.toString();

    window.location.hash = `#initialize/connect/connect-machine-ip?${queryString}`;
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
          <img src="img/init-panel/icon-usb-cable.svg" draggable="false" />
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
