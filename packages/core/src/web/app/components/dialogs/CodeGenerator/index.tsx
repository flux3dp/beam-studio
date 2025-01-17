import React, { useState, useMemo, useRef } from 'react';
import { Flex, Radio } from 'antd';
import useI18n from 'helpers/useI18n';
import DraggableModal from 'app/widgets/DraggableModal';
import styles from './index.module.scss';

import QRCodeGenerator from './QRCodeGenerator';
import BarcodeGenerator from './BarcodeGenerator';
import { importBarcodeSvgElement, importQrCodeSvgElement } from './svgOperation';

interface Props {
  onClose: () => void;
}

export default function CodeGenerator({ onClose }: Props): JSX.Element {
  const {
    alert: tAlert,
    topbar: {
      menu: { tools: tTools },
    },
    code_generator: tCodeGenerator,
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
    [tCodeGenerator]
  );

  const renderContent = () =>
    tabKey === 'qrcode' ? (
      <QRCodeGenerator
        ref={generatorRef}
        isInvert={isInvert}
        setIsInvert={setIsInvert}
        text={text}
        setText={setText}
      />
    ) : (
      <BarcodeGenerator
        ref={generatorRef}
        isInvert={isInvert}
        setIsInvert={setIsInvert}
        text={text}
        setText={setText}
      />
    );

  return (
    <DraggableModal
      open
      centered
      title={
        <Flex gap={12} className={styles['title-flex']}>
          <div>{tTools.code_generator}</div>
          <Radio.Group
            className={styles['fw-n']}
            size="small"
            optionType="button"
            options={options}
            defaultValue={tabKey}
            onChange={(e) => {
              setTabKey(e.target.value);
              setIsInvert(false);
            }}
          />
        </Flex>
      }
      onCancel={onClose}
      onOk={handleOk}
      width="520"
      cancelText={tAlert.cancel}
      okText={tAlert.confirm}
      okButtonProps={{ disabled: !text }}
      className={styles.modal}
    >
      {renderContent()}
    </DraggableModal>
  );
}
