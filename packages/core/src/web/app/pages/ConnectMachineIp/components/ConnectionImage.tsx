import React, { useMemo } from 'react';

import classNames from 'classnames';

import styles from '../index.module.scss';

interface Props {
  isAdor: boolean;
  isBb2: boolean;
  isUsb: boolean;
  isWired: boolean;
}

const ConnectionImage = ({ isAdor, isBb2, isUsb, isWired }: Props): JSX.Element => {
  const touchPanelSrc = useMemo(() => {
    if (isAdor) return 'core-img/init-panel/ador-ip.jpg';

    if (isBb2) return `core-img/init-panel/beambox-2-ip-${isWired ? 'wired' : 'wireless'}.png`;

    return `img/init-panel/network-panel-${isWired ? 'wired' : 'wireless'}.jpg`;
  }, [isAdor, isWired, isBb2]);

  if (isUsb) {
    return (
      <div className={classNames(styles.image, styles['is-usb'])}>
        <div className={classNames(styles.circle, styles.c1)} />
        <img className={styles['is-usb']} draggable="false" src="img/init-panel/icon-usb-cable.svg" />
        <div className={classNames(styles.circle, styles.c2)} />
      </div>
    );
  }

  return (
    <div className={styles.image}>
      <div className={classNames(styles.hint, { [styles.wired]: isWired })} />
      <img draggable="false" src={touchPanelSrc} />
    </div>
  );
};

export default ConnectionImage;
