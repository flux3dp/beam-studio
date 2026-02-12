import React, { useImperativeHandle, useRef } from 'react';

import type { QRCodeProps } from 'antd';
import { QRCode } from 'antd';

import useI18n from '@core/helpers/useI18n';

import styles from './QRCodeGenerator.module.scss';

export interface QRcodeProps {
  errorLevel: QRCodeProps['errorLevel'];
  isInvert: boolean;
  value: string;
}

export interface QRcodeRef {
  getElem: () => null | SVGSVGElement | undefined;
  getProps: () => QRcodeProps;
}

const QRCodePreview = (props: QRcodeProps & { ref?: React.Ref<QRcodeRef> }): React.JSX.Element => {
  const { errorLevel, isInvert, ref, value } = props;
  const { global: tGlobal } = useI18n();
  const divRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    getElem: () => divRef.current?.querySelector('svg:not(:empty)'),
    getProps: () => props,
  }));

  return (
    <div className={styles['qrcode-container']} id="qrcode-container" ref={divRef}>
      {value ? (
        <QRCode
          bgColor={isInvert ? 'black' : 'transparent'}
          className={styles.qrcode}
          color={isInvert ? 'white' : 'black'}
          errorLevel={errorLevel}
          size={1000}
          type="svg"
          value={value}
        />
      ) : (
        <div className={styles.placeholder}>{tGlobal.preview}</div>
      )}
    </div>
  );
};

export default QRCodePreview;
