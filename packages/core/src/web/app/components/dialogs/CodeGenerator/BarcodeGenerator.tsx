import React, { useEffect, useMemo, useState } from 'react';

import {
  AlignCenterOutlined,
  AlignLeftOutlined,
  AlignRightOutlined,
  BoldOutlined,
  ItalicOutlined,
} from '@ant-design/icons';
import { Button, ConfigProvider, Divider, Flex, Input, InputNumber, Radio, Switch } from 'antd';

import fontFuncs from '@core/app/actions/beambox/font-funcs';
import Select from '@core/app/widgets/AntdSelect';
import { fontFamilySelectFilterOption, renderTextOptions } from '@core/helpers/fonts/renderTextOptions';
import useI18n from '@core/helpers/useI18n';

import styles from './BarcodeGenerator.module.scss';
import type { BarcodeRef } from './BarcodePreview';
import BarcodePreview, { defaultOptions, formats } from './BarcodePreview';

interface Props {
  isInvert: boolean;
  setIsInvert: (isInvert: boolean) => void;
  setText: (text: string) => void;
  tabSlot?: React.ReactNode;
  text: string;
}

// copied from src/web/app/views/beambox/Right-Panels/Options-Blocks/TextOptions.tsx
const renderOption = (option) => {
  const src = fontHelper.getWebFontPreviewUrl(option.value);

  if (src) {
    return (
      <div className={styles['family-option']}>
        <div className={styles['img-container']}>
          <img alt={option.label} draggable="false" src={src} />
        </div>
        {src.includes('monotype') && <FluxIcons.FluxPlus />}
      </div>
    );
  }

  return <div style={{ fontFamily: `'${option.value}'`, maxHeight: 24 }}>{option.label}</div>;
};
// end of copied code

const BarcodeGenerator = ({
  isInvert,
  ref,
  setIsInvert,
  setText,
  tabSlot,
  text,
}: Props & { ref?: React.Ref<BarcodeRef> }) => {
  const { barcode_generator: t, code_generator: tCode, qr_code_generator: tQr } = useI18n();
  const [options, setOptions] = useState({ ...defaultOptions, displayValue: false });
  const [validFontStyles, setValidFontStyles] = useState([]);
const BarcodeGenerator = ({ isInvert, ref, setIsInvert, setText, text }: Props & { ref?: React.Ref<BarcodeRef> }) => {
  const { barcode_generator: t } = useI18n();
  const [options, setOptions] = useState(defaultOptions);
  const [validFontStyles, setValidFontStyles] = useState<string[]>([]);
  const formatOptions = formats.map((value) => ({ label: value, value }));
  const fontFamilies = fontFuncs.requestAvailableFontFamilies();
  const fontOptions = useMemo(
    () => fontFamilies.map((value: string) => renderTextOptions(value, false)),
    [fontFamilies],
  );
  const [isBold, isItalic] = useMemo(
    () => [options.fontOptions!.includes('bold'), options.fontOptions!.includes('italic')],
    [options.fontOptions],
  );
  const showText = options.displayValue;

  useEffect(() => {
    const fontStyles = fontFuncs.requestFontsOfTheFontFamily(options.font).map(({ style }) => style);

    setValidFontStyles(fontStyles);
  }, [options.font]);

  const onToggleInvert = () => {
    const [black, white] = ['#000000', '#ffffff'];

    setIsInvert(!isInvert);
    setOptions({
      ...options,
      background: isInvert ? white : black,
      lineColor: isInvert ? black : white,
    });
  };

  return (
    <Flex className={styles.layout} gap={24}>
      <div className={styles.preview}>
        <BarcodePreview options={options} ref={ref} renderer="svg" value={text} />
      </div>
      <Flex className={styles.form} gap={12} vertical>
        {tabSlot}
        <div className={styles.field}>
          <div className={styles.label}>{tCode.content}</div>
          <Input.TextArea
            className={styles.input}
            maxLength={200}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            placeholder={tQr.placeholder}
            rows={4}
            showCount
            value={text}
          />
        </div>
        <Flex align="center" gap={12} justify="space-between">
          <span className={styles.label}>{tCode.type}</span>
          <Select
            allowClear={false}
            className={styles.control}
            onChange={(format) => setOptions({ ...options, format })}
            onKeyDown={(e) => e.stopPropagation()}
            options={formatOptions}
            popupMatchSelectWidth={false}
            showSearch
            value={[options.format]}
          />
        </Flex>
        <Flex align="center" gap={12} justify="space-between">
          <span className={styles.label}>{t.bar_width}</span>
          <InputNumber
            className={styles.control}
            max={4}
            min={1}
            onChange={(width) => setOptions({ ...options, width })}
            onKeyDown={(e) => e.stopPropagation()}
            value={options.width}
          />
        </Flex>
        <Flex align="center" gap={12} justify="space-between">
          <span className={styles.label}>{t.bar_height}</span>
          <InputNumber
            className={styles.control}
            max={300}
            min={1}
            onChange={(height) => setOptions({ ...options, height })}
            onKeyDown={(e) => e.stopPropagation()}
            value={options.height}
          />
        </Flex>
        <Flex align="center" justify="space-between">
          <span className={styles.label}>{tQr.invert}</span>
          <Switch checked={isInvert} onChange={onToggleInvert} />
        </Flex>
        <Flex align="center" justify="space-between">
          <span className={styles.label}>{t.text}</span>
          <Switch checked={showText} onChange={(checked) => setOptions({ ...options, displayValue: checked })} />
        </Flex>
        {showText && (
          <>
            <Flex align="center" gap={12} justify="space-between">
              <span className={styles.label}>{t.font}</span>
              <Select
                allowClear={false}
                className={styles.control}
                filterOption={(input: string, option?: { label: React.JSX.Element; value: string }) => {
                  if (option?.value) {
                    const searchKey = input.toLowerCase();

                    if (option.value.toLowerCase().includes(searchKey)) {
                      return true;
                    }

                    const fontName = fontFuncs.fontNameMap.get(option.value) || '';

                    if (fontName.toLowerCase().includes(searchKey)) {
                      return true;
                    }
                  }

                  return false;
                }}
                onChange={(font) => setOptions({ ...options, font, fontOptions: '' })}
                onKeyDown={(e) => e.stopPropagation()}
                options={fontOptions}
                showSearch
                value={[options.font]}
              />
            </Flex>
            <Flex align="center" gap={12} justify="space-between">
              <span className={styles.label}>{t.font_size}</span>
              <InputNumber
                className={styles.control}
                max={100}
                min={1}
                onChange={(fontSize) => setOptions({ ...options, fontSize })}
                onKeyDown={(e) => e.stopPropagation()}
                value={options.fontSize}
              />
            </Flex>
            <Flex align="center" gap={12} justify="space-between">
              <span className={styles.label}>{t.text_margin}</span>
              <InputNumber
                className={styles.control}
                max={100}
                onChange={(textMargin) => setOptions({ ...options, textMargin })}
                onKeyDown={(e) => e.stopPropagation()}
                value={options.textMargin}
              />
            </Flex>
            <Flex align="center" gap={8}>
              <ConfigProvider theme={{ components: { Radio: { buttonPaddingInline: 12 } } }}>
                <Radio.Group
                  onChange={(e) => setOptions({ ...options, textAlign: e.target.value })}
                  options={[
                    { label: <AlignLeftOutlined />, value: 'left' },
                    { label: <AlignCenterOutlined />, value: 'center' },
                    { label: <AlignRightOutlined />, value: 'right' },
                  ]}
                  optionType="button"
                  value={options.textAlign}
            <Flex vertical>
              <Form.Item className={styles['flex-child']} label={t.font}>
                <Select
                  allowClear={false}
                  filterOption={fontFamilySelectFilterOption}
                  onChange={(font) => setOptions({ ...options, font, fontOptions: '' })}
                  onKeyDown={(e) => e.stopPropagation()}
                  options={fontOptions}
                  showSearch
                  value={[options.font]}
                />
              </Form.Item>
              <Form.Item className={styles['flex-child']} label={t.font_size}>
                <InputNumber
                  className={styles['w-100']}
                  max={100}
                  min={1}
                  onChange={(fontSize) => setOptions({ ...options, fontSize })}
                  onKeyDown={(e) => e.stopPropagation()}
                  value={options.fontSize}
                />
              </ConfigProvider>
              <Divider type="vertical" />
              <Button
                className={isBold ? styles['check-text-option'] : ''}
                disabled={!validFontStyles.some((style) => /bold/i.test(style))}
                icon={<BoldOutlined />}
                onClick={() => {
                  const { fontOptions } = options;

                  setOptions({
                    ...options,
                    fontOptions: !isBold ? `${fontOptions} bold` : fontOptions.replace('bold', '').trim(),
                  });
                }}
              />
              <Button
                className={isItalic ? styles['check-text-option'] : ''}
                disabled={!validFontStyles.some((style) => /italic/i.test(style))}
                icon={<ItalicOutlined />}
                onClick={() => {
                  const { fontOptions } = options;

                  setOptions({
                    ...options,
                    fontOptions: !isItalic ? `${fontOptions} italic` : fontOptions.replace('italic', '').trim(),
                  });
                }}
              />
            </Flex>
          </>
        )}
      </Flex>
    </Flex>
  );
};

export default BarcodeGenerator;
