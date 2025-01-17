import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import JsBarcode, { Options } from 'jsbarcode';

import useI18n from 'helpers/useI18n';
import styles from './Barcode.module.scss';

export type Renderer = 'canvas' | 'image' | 'svg';

export const formats = [
  'CODE39',
  'CODE128',
  'CODE128A',
  'CODE128B',
  'CODE128C',
  'EAN13',
  'EAN8',
  'EAN5',
  'EAN2',
  'UPC',
  'UPCE',
  'ITF14',
  'ITF',
  'MSI',
  'MSI10',
  'MSI11',
  'MSI1010',
  'MSI1110',
  'pharmacode',
  'codabar',
] as const;
export type Format = (typeof formats)[number];

export const defaultOptions: Options = {
  format: 'CODE128',
  width: 2,
  height: 100,
  displayValue: true,
  fontOptions: '',
  font: 'Noto Sans',
  textAlign: 'center',
  textPosition: 'bottom',
  textMargin: 2,
  fontSize: 20,
  background: '#ffffff',
  lineColor: '#000000',
  margin: 10,
  ean128: false,
};

export interface BarcodeProps {
  renderer?: Renderer;
  value: string;
  options?: Options;
  className?: string;
}

export function Barcode({
  className,
  value,
  options = defaultOptions,
  renderer = 'svg',
}: Readonly<BarcodeProps>): JSX.Element {
  const {
    barcode_generator: { barcode: t },
  } = useI18n();
  const containerRef = useRef(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      try {
        JsBarcode(containerRef.current, value, options);
        setError(null);
      } catch {
        setError(t.invalid_value);
      }
    }
  }, [value, options, t]);

  const contentClasses = styles[error ? 'hidden' : 'visible'];
  const errorClasses = classNames(styles[error ? 'visible' : 'hidden'], styles['error-span']);

  const renderBarcodeElement = () => {
    switch (renderer) {
      case 'canvas':
        return <canvas id="barcode" ref={containerRef} className={contentClasses} />;
      case 'image':
        return <img id="barcode" ref={containerRef} alt="barcode" className={contentClasses} />;
      case 'svg':
      default:
        return (
          <svg
            id="barcode"
            ref={containerRef}
            className={classNames(contentClasses, styles['barcode-svg'])}
          />
        );
    }
  };

  return (
    <div id="barcode-container" className={classNames(styles.container, className)}>
      {renderBarcodeElement()}
      <span className={errorClasses}>{error}</span>
    </div>
  );
}
