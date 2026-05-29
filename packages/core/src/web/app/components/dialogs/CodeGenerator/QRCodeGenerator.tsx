import React from 'react';

import { InfoCircleOutlined } from '@ant-design/icons';
import type { QRCodeProps } from 'antd';
import { Flex, Input, Segmented, Switch } from 'antd';

import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';

import styles from './QRCodeGenerator.module.scss';
import QRCodePreview from './QRCodePreview';
import type { QRcodeRef } from './QRCodePreview';

interface Props {
  isInvert: boolean;
  setIsInvert: (isInvert: boolean) => void;
  setText: (text: string) => void;
  tabSlot?: React.ReactNode;
  text: string;
}

type ErrorLevel = NonNullable<QRCodeProps['errorLevel']>;

const errorOptions: Array<{ label: string; value: ErrorLevel }> = [
  { label: '7%', value: 'L' },
  { label: '15%', value: 'M' },
  { label: '20%', value: 'Q' },
  { label: '30%', value: 'H' },
];

const QRCodeGenerator = ({
  isInvert,
  ref,
  setIsInvert,
  setText,
  tabSlot,
  text,
}: Props & { ref?: React.Ref<QRcodeRef> }) => {
  const { code_generator: tCode, qr_code_generator: t } = useI18n();
  const [errorLevel, setErrorLevel] = React.useState<ErrorLevel>('L');

  return (
    <Flex className={styles.layout} gap={24}>
      <QRCodePreview errorLevel={errorLevel} isInvert={isInvert} ref={ref} value={text} />
      <Flex className={styles.form} gap={16} vertical>
        {tabSlot}
        <div className={styles.field}>
          <div className={styles.label}>{tCode.content}</div>
          <Input.TextArea
            className={styles.input}
            maxLength={200}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            placeholder={t.placeholder}
            rows={4}
            showCount
            value={text}
          />
        </div>
        <div className={styles.field}>
          <div className={styles.label}>
            {`${t.error_tolerance} `}
            <InfoCircleOutlined onClick={() => browser.open(t.error_tolerance_link)} />
          </div>
          <Segmented<ErrorLevel>
            block
            className={styles['accent-segmented']}
            onChange={setErrorLevel}
            options={errorOptions}
            value={errorLevel}
          />
        </div>
        <Flex align="center" justify="space-between">
          <span className={styles.label}>{t.invert}</span>
          <Switch checked={isInvert} onChange={() => setIsInvert(!isInvert)} />
        </Flex>
      </Flex>
    </Flex>
  );
};

export default QRCodeGenerator;
