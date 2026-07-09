import type { RefObject } from 'react';
import React, { useMemo, useRef, useState } from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Button, ConfigProvider, Flex, Segmented, Switch } from 'antd';

import Select from '@core/app/widgets/AntdSelect';
import DraggableModal from '@core/app/widgets/DraggableModal';
import UnitInput from '@core/app/widgets/UnitInput';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import useI18n from '@core/helpers/useI18n';
import { isVariableTextSupported, setVariableCodeData } from '@core/helpers/variableText';
import browser from '@core/implementations/browser';
import { VariableTextType } from '@core/interfaces/ObjectPanel';

import BarcodeGenerator from './BarcodeGenerator';
import type { BarcodeRef } from './BarcodePreview';
import styles from './index.module.scss';
import QRCodeGenerator from './QRCodeGenerator';
import type { QRcodeRef } from './QRCodePreview';
import { importBarcodeSvgElement, importQrCodeSvgElement } from './svgOperation';

interface Props {
  onClose: () => void;
}

type TabKey = 'barcode' | 'qrcode';

export default function CodeGenerator({ onClose }: Props): React.JSX.Element {
  const {
    alert: tAlert,
    beambox: {
      right_panel: {
        object_panel: { option_panel: tOptionPanel },
      },
    },
    code_generator: tCodeGenerator,
    generators: tGenerators,
  } = useI18n();
  const [tabKey, setTabKey] = useState<TabKey>('qrcode');
  const [isInvert, setIsInvert] = useState(false);
  const [text, setText] = useState('');
  const [vtType, setVtType] = useState(VariableTextType.NONE);
  const [vtOffset, setVtOffset] = useState(0);
  const workarea = useWorkarea();
  const showVariableBlock = useMemo(isVariableTextSupported, [workarea]);
  const isVTToggleOn = useMemo(() => vtType !== VariableTextType.NONE, [vtType]);
  const generatorRef = useRef<BarcodeRef | QRcodeRef>(null);

  const handleOk = async () => {
    const svgElement = generatorRef.current?.getElem();
    const props = generatorRef.current?.getProps();
    let elem: SVGElement;

    if (!svgElement || !props) {
      return;
    }

    if (tabKey === 'qrcode') {
      elem = await importQrCodeSvgElement(svgElement, isInvert);
    } else {
      elem = await importBarcodeSvgElement(svgElement, isInvert);
    }

    if (isVTToggleOn) {
      setVariableCodeData(elem, vtType, vtOffset, isInvert, props, tabKey);
    }

    svgElement.remove();

    onClose();
  };

  const tabOptions = useMemo(
    () => [
      { label: tCodeGenerator.qr_code, value: 'qrcode' as const },
      { label: tCodeGenerator.barcode, value: 'barcode' as const },
    ],
    [tCodeGenerator],
  );

  const tabSlot = (
    <Segmented<TabKey>
      block
      className={styles['accent-segmented']}
      onChange={(value) => {
        setTabKey(value);
        setIsInvert(false);
      }}
      options={tabOptions}
      value={tabKey}
    />
  );

  const onToggleVTType = () => {
    setVtType(isVTToggleOn ? VariableTextType.NONE : VariableTextType.NUMBER);
  };

  const vtOptions = useMemo(
    () => [
      { label: tOptionPanel.number, value: VariableTextType.NUMBER },
      { label: tOptionPanel.current_time, value: VariableTextType.TIME },
      { label: 'CSV', value: VariableTextType.CSV },
    ],
    [tOptionPanel],
  );

  const renderContent = () =>
    tabKey === 'qrcode' ? (
      <QRCodeGenerator
        isInvert={isInvert}
        ref={generatorRef as RefObject<QRcodeRef>}
        setIsInvert={setIsInvert}
        setText={setText}
        tabSlot={tabSlot}
        text={text}
      />
    ) : (
      <BarcodeGenerator
        isInvert={isInvert}
        ref={generatorRef as RefObject<BarcodeRef>}
        setIsInvert={setIsInvert}
        setText={setText}
        tabSlot={tabSlot}
        text={text}
      />
    );

  return (
    <DraggableModal
      disableMobileDrag
      footer={
        <Flex justify="space-between">
          <Button onClick={onClose}>{tAlert.cancel}</Button>
          <Button disabled={!text} onClick={handleOk} type="primary">
            {tCodeGenerator.import}
          </Button>
        </Flex>
      }
      onCancel={onClose}
      open
      title={tGenerators.code_generator}
      width={840}
    >
      <ConfigProvider theme={{ components: { Segmented: { itemSelectedColor: '#1677ff' } } }}>
        {renderContent()}
      </ConfigProvider>
      {showVariableBlock && (
        <div className={styles['variable-block']}>
          <div className={styles.row}>
            <div className={styles.label}>
              {tOptionPanel.variable_text}
              <QuestionCircleOutlined
                className={styles.icon}
                onClick={() => browser.open(tOptionPanel.variable_text_link)}
              />
            </div>
            <Switch checked={isVTToggleOn} onChange={onToggleVTType} />
          </div>
          {isVTToggleOn && (
            <div className={styles.row}>
              <Select
                className={styles.select}
                onChange={(val) => setVtType(val)}
                onKeyDown={(e) => e.stopPropagation()}
                options={vtOptions}
                popupMatchSelectWidth={false}
                value={vtType}
              />
              {vtType !== VariableTextType.TIME && (
                <div className={styles.offset}>
                  <div>{tOptionPanel.offset}</div>
                  <UnitInput
                    min={0}
                    onChange={(val) => {
                      if (val) setVtOffset(val);
                    }}
                    precision={0}
                    value={vtOffset}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </DraggableModal>
  );
}
