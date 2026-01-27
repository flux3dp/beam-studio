import type { RefObject } from 'react';
import React, { useMemo, useRef, useState } from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Flex, Radio, Switch } from 'antd';

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

export default function CodeGenerator({ onClose }: Props): React.JSX.Element {
  const {
    alert: tAlert,
    beambox: {
      right_panel: {
        object_panel: { option_panel: tOptionPanel },
      },
    },
    code_generator: tCodeGenerator,
    topbar: {
      menu: { tools: tTools },
    },
  } = useI18n();
  const [tabKey, setTabKey] = useState('qrcode');
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

  const options = useMemo(
    () => [
      { label: tCodeGenerator.qr_code, value: 'qrcode' },
      { label: tCodeGenerator.barcode, value: 'barcode' },
    ],
    [tCodeGenerator],
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
        text={text}
      />
    ) : (
      <BarcodeGenerator
        isInvert={isInvert}
        ref={generatorRef as RefObject<BarcodeRef>}
        setIsInvert={setIsInvert}
        setText={setText}
        text={text}
      />
    );

  return (
    <DraggableModal
      cancelText={tAlert.cancel}
      disableMobileDrag
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
      width={520}
    >
      {renderContent()}
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
