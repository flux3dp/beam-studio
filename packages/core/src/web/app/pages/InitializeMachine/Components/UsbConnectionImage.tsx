import React from 'react';

import classNames from 'classnames';

import styles from './UsbConnectionImage.module.scss';

const UsbConnectionImage = (): React.JSX.Element => (
  <div className={styles.image}>
    <div className={classNames(styles.circle, styles.c1)} />
    <img draggable="false" src="img/init-panel/icon-usb-cable.svg" />
    <div className={classNames(styles.circle, styles.c2)} />
  </div>
);

export default UsbConnectionImage;
