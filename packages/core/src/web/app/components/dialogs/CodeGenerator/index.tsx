import React, { useMemo, useRef, useState } from 'react';

import { Flex, Radio } from 'antd';

import DraggableModal from '@core/app/widgets/DraggableModal';
import useI18n from '@core/helpers/useI18n';

import BarcodeGenerator from './BarcodeGenerator';
import styles from './index.module.scss';
import QRCodeGenerator from './QRCodeGenerator';
import { importBarcodeSvgElement, importQrCodeSvgElement } from './svgOperation';

interface Props {
  onClose: () => void;
}

export default function CodeGenerator({ onClose }: Props): React.JSX.Element {
  const {
    alert: tAlert,
    code_generator: tCodeGenerator,
    topbar: {
      menu: { tools: tTools },
    },
  } = useI18n();
  const [tabKey, setTabKey] = useState('qrcode');
  const [isInvert, setIsInvert] = useState(false);
  const [text, setText] = useState('');
  const generatorRef = useRef<HTMLDivElement>(null);

  const handleOk = async () => {
    const svgElement = generatorRef.current?.querySelector('svg');

    if (!svgElement) {
      return;
    }

    if (tabKey === 'qrcode') {
      await importQrCodeSvgElement(svgElement, isInvert);
    } else {
      await importBarcodeSvgElement(svgElement, isInvert);
    }

    svgElement.remove();

    onClose();
  };

  const options = useMemo(
    () => [
      { label: tCodeGenerator.qr_code, value: 'qrcode' },
      { label: tCodeGenerator.barcode, value: 'barcode' },
    ],
    [tCodeGenerator],
  );

  const renderContent = () =>
    tabKey === 'qrcode' ? (
      <QRCodeGenerator isInvert={isInvert} ref={generatorRef} setIsInvert={setIsInvert} setText={setText} text={text} />
    ) : (
      <BarcodeGenerator
        isInvert={isInvert}
        ref={generatorRef}
        setIsInvert={setIsInvert}
        setText={setText}
        text={text}
      />
    );

  return (
    <DraggableModal
      cancelText={tAlert.cancel}
      centered
      className={styles.modal}
      okButtonProps={{ disabled: !text }}
      okText={tAlert.confirm}
      onCancel={onClose}
      onOk={handleOk}
      open
      title={
        <Flex className={styles['title-flex']} gap={12}>
          <div>{tTools.code_generator}</div>
          <Radio.Group
            className={styles['fw-n']}
            defaultValue={tabKey}
            onChange={(e) => {
              setTabKey(e.target.value);
              setIsInvert(false);
            }}
            options={options}
            optionType="button"
            size="small"
          />
        </Flex>
      }
      width="520"
    >
      {renderContent()}
    </DraggableModal>
  );
}
