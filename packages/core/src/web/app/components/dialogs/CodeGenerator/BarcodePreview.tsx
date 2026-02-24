/* eslint-disable reactRefresh/only-export-components */
import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';

import classNames from 'classnames';
import type { Options } from 'jsbarcode';
import JsBarcode from 'jsbarcode';

import useI18n from '@core/helpers/useI18n';

import styles from './BarcodePreview.module.scss';

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
  background: '#ffffff',
  displayValue: true,
  ean128: false,
  font: 'Noto Sans',
  fontOptions: '',
  fontSize: 20,
  format: 'CODE128',
  height: 100,
  lineColor: '#000000',
  margin: 10,
  textAlign: 'center',
  textMargin: 2,
  textPosition: 'bottom',
  width: 2,
};

export interface BarcodeProps {
  className?: string;
  options?: Options;
  renderer?: Renderer;
  value: string;
}

export interface BarcodeRef {
  getElem: () => null | SVGSVGElement | undefined;
  getProps: () => BarcodeProps;
}

const BarcodePreview = (props: Readonly<BarcodeProps & { ref?: React.Ref<BarcodeRef> }>): React.JSX.Element => {
  const { className, options = defaultOptions, ref, renderer = 'svg', value } = props;
  const {
    barcode_generator: { barcode: t },
  } = useI18n();
  const containerRef = useRef(null);
  const [error, setError] = useState<null | string>(null);

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

  useImperativeHandle(ref, () => ({
    getElem: () => containerRef.current,
    getProps: () => ({ options, value }),
  }));

  const contentClasses = styles[error ? 'hidden' : 'visible'];
  const errorClasses = classNames(styles[error ? 'visible' : 'hidden'], styles['error-span']);

  const renderBarcodeElement = () => {
    switch (renderer) {
      case 'canvas':
        return <canvas className={contentClasses} id="barcode" ref={containerRef} />;
      case 'image':
        return <img alt="barcode" className={contentClasses} id="barcode" ref={containerRef} />;
      case 'svg':
      default:
        return <svg className={classNames(contentClasses, styles['barcode-svg'])} id="barcode" ref={containerRef} />;
    }
  };

  return (
    <div className={classNames(styles.container, className)} id="barcode-container">
      {renderBarcodeElement()}
      <span className={errorClasses}>{error}</span>
    </div>
  );
};

export default BarcodePreview;
