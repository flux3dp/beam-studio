import React from 'react';

import { InfoCircleOutlined } from '@ant-design/icons';
import type { QRCodeProps } from 'antd';
import { Checkbox, ConfigProvider, Flex, Input, Radio } from 'antd';

import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';

import styles from './QRCodeGenerator.module.scss';
import QRCodePreview from './QRCodePreview';
import type { QRcodeRef } from './QRCodePreview';

interface Props {
  isInvert: boolean;
  setIsInvert: (isInvert: boolean) => void;
  setText: (text: string) => void;
  text: string;
}

const QRCodeGenerator = ({ isInvert, ref, setIsInvert, setText, text }: Props & { ref?: React.Ref<QRcodeRef> }) => {
  const { qr_code_generator: t } = useI18n();
  const [errorLevel, setErrorLevel] = React.useState<QRCodeProps['errorLevel']>('L');

  return (
    <div>
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
        <QRCodePreview errorLevel={errorLevel} isInvert={isInvert} ref={ref} value={text} />

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
};

export default QRCodeGenerator;
