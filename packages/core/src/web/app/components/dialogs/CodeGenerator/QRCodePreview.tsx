import React, { useImperativeHandle, useRef, useState } from 'react';

import type { QRCodeProps } from 'antd';
import { QRCode } from 'antd';

import useI18n from '@core/helpers/useI18n';

import styles from './QRCodeGenerator.module.scss';
import ZoomToolbar from './ZoomToolbar';

const MIN_ZOOM = 10;
const MAX_ZOOM = 400;
const ZOOM_STEP = 25;

export interface QRcodeProps {
  errorLevel: QRCodeProps['errorLevel'];
  isInvert: boolean;
  value: string;
}

export interface QRcodeRef {
  getElem: () => null | SVGSVGElement | undefined;
  getProps: () => QRcodeProps;
}

const clampZoom = (value: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));

const QRCodePreview = (props: QRcodeProps & { ref?: React.Ref<QRcodeRef> }): React.JSX.Element => {
  const { errorLevel, isInvert, ref, value } = props;
  const { global: tGlobal } = useI18n();
  const divRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(100);

  useImperativeHandle(ref, () => ({
    getElem: () => divRef.current?.querySelector('svg:not(:empty)'),
    getProps: () => props,
  }));

  return (
    <div className={styles['qrcode-container']} id="qrcode-container" ref={divRef}>
      <div className={styles['zoom-wrap']} style={{ transform: `scale(${zoom / 100})` }}>
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
      <ZoomToolbar
        onFit={() => setZoom(100)}
        onSetZoom={(z) => setZoom(clampZoom(z))}
        onZoomIn={() => setZoom((z) => clampZoom(z + ZOOM_STEP))}
        onZoomOut={() => setZoom((z) => clampZoom(z - ZOOM_STEP))}
        zoom={zoom}
      />
    </div>
  );
};

export default QRCodePreview;
