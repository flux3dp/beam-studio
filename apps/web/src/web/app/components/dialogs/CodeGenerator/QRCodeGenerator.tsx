import React, { forwardRef } from 'react';
import { Checkbox, ConfigProvider, Flex, Input, QRCode, QRCodeProps, Radio } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

import browser from 'implementations/browser';
import useI18n from 'helpers/useI18n';

import styles from './QRCodeGenerator.module.scss';

interface Props {
  isInvert: boolean;
  setIsInvert: (isInvert: boolean) => void;
  text: string;
  setText: (text: string) => void;
}

export default forwardRef<HTMLDivElement, Props>(
  ({ isInvert, setIsInvert, text, setText }, ref): JSX.Element => {
    const { qr_code_generator: t } = useI18n();
    const [errorLevel, setErrorLevel] = React.useState<QRCodeProps['errorLevel']>('L');

    return (
      <div ref={ref}>
        <Input.TextArea
          className={styles.input}
          rows={5}
          maxLength={200}
          value={text}
          onKeyDown={(e) => e.stopPropagation()}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.placeholder}
          showCount
        />
        <div className={styles.content}>
          <div id="qrcode-container" className={styles['qrcode-container']}>
            {text ? (
              <QRCode
                type="svg"
                className={styles.qrcode}
                value={text}
                size={1000}
                errorLevel={errorLevel}
                color={isInvert ? 'white' : 'black'}
                bgColor={isInvert ? 'black' : 'transparent'}
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
                  value={errorLevel}
                  onChange={(e) => setErrorLevel(e.target.value)}
                  size="small"
                  options={[
                    { label: '7%', value: 'L' },
                    { label: '15%', value: 'M' },
                    { label: '20%', value: 'Q' },
                    { label: '30%', value: 'H' },
                  ]}
                />
              </ConfigProvider>

              <Checkbox
                className={styles.checkbox}
                checked={isInvert}
                onChange={() => setIsInvert(!isInvert)}
              >
                {t.invert}
              </Checkbox>
            </Flex>
          </div>
        </div>
      </div>
    );
  }
);
