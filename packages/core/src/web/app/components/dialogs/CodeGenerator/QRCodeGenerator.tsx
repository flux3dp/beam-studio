import React, { forwardRef } from 'react';

import { InfoCircleOutlined } from '@ant-design/icons';
import type { QRCodeProps } from 'antd';
import { Checkbox, ConfigProvider, Flex, Input, QRCode, Radio } from 'antd';

import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';

import styles from './QRCodeGenerator.module.scss';

interface Props {
  isInvert: boolean;
  setIsInvert: (isInvert: boolean) => void;
  setText: (text: string) => void;
  text: string;
}

export default forwardRef<HTMLDivElement, Props>(({ isInvert, setIsInvert, setText, text }, ref): React.JSX.Element => {
  const { qr_code_generator: t } = useI18n();
  const [errorLevel, setErrorLevel] = React.useState<QRCodeProps['errorLevel']>('L');

  return (
    <div ref={ref}>
      <Input.TextArea
        className={styles.input}
        maxLength={200}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.stopPropagation()}
        placeholder={t.placeholder}
        rows={5}
        showCount
        value={text}
      />
      <div className={styles.content}>
        <div className={styles['qrcode-container']} id="qrcode-container">
          {text ? (
            <QRCode
              bgColor={isInvert ? 'black' : 'transparent'}
              className={styles.qrcode}
              color={isInvert ? 'white' : 'black'}
              errorLevel={errorLevel}
              size={1000}
              type="svg"
              value={text}
            />
          ) : (
            <div className={styles.placeholder}>{t.preview}</div>
          )}
        </div>

        <div className={styles.settings}>
          <div className={styles.label}>
            {`${t.error_tolerance} `}
            <InfoCircleOutlined onClick={() => browser.open(t.error_tolerance_link)} />
          </div>

          <Flex vertical>
            <ConfigProvider
              theme={{
                components: { Radio: { buttonPaddingInline: 16, wrapperMarginInlineEnd: 0 } },
              }}
            >
              <Radio.Group
                onChange={(e) => setErrorLevel(e.target.value)}
                options={[
                  { label: '7%', value: 'L' },
                  { label: '15%', value: 'M' },
                  { label: '20%', value: 'Q' },
                  { label: '30%', value: 'H' },
                ]}
                size="small"
                value={errorLevel}
              />
            </ConfigProvider>

            <Checkbox checked={isInvert} className={styles.checkbox} onChange={() => setIsInvert(!isInvert)}>
              {t.invert}
            </Checkbox>
          </Flex>
        </div>
      </div>
    </div>
  );
});
