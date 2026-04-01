import React, { useEffect, useMemo, useState } from 'react';

import {
  AlignCenterOutlined,
  AlignLeftOutlined,
  AlignRightOutlined,
  BoldOutlined,
  ItalicOutlined,
} from '@ant-design/icons';
import { Button, Checkbox, ConfigProvider, Flex, Form, Input, InputNumber, Radio, Space } from 'antd';
import classNames from 'classnames';

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
  text: string;
}

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

  useEffect(() => {
    const fontStyles = fontFuncs.requestFontsOfTheFontFamily(options.font).map(({ style }) => style);

    setValidFontStyles(fontStyles);
  }, [options.font]);

  return (
    <div>
      <BarcodePreview className={styles['barcode-container']} options={options} ref={ref} renderer="svg" value={text} />
      <ConfigProvider theme={{ components: { Form: { itemMarginBottom: 12 } } }}>
        <Form>
          <Space.Compact className={classNames(styles['w-100'], styles['mb-20'])}>
            <Input onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.stopPropagation()} value={text} />
            <ConfigProvider theme={{ token: { colorBgContainer: '#FAFAFA' } }}>
              <Select
                allowClear={false}
                onChange={(format) => setOptions({ ...options, format })}
                onKeyDown={(e) => e.stopPropagation()}
                options={formatOptions}
                placement="bottomRight"
                popupMatchSelectWidth={false}
                showSearch
                value={[options.format]}
              />
            </ConfigProvider>
          </Space.Compact>

          <Flex className={styles['form-container']} gap={32} justify="center">
            <Flex vertical>
              <Form.Item className={styles['flex-child']} label={t.bar_width}>
                <InputNumber
                  className={styles['w-100']}
                  max={4}
                  min={1}
                  onChange={(width) => setOptions({ ...options, width })}
                  onKeyDown={(e) => e.stopPropagation()}
                  value={options.width}
                />
              </Form.Item>
              <Form.Item className={styles['flex-child']} label={t.bar_height}>
                <InputNumber
                  className={styles['w-100']}
                  max={300}
                  min={1}
                  onChange={(height) => setOptions({ ...options, height })}
                  onKeyDown={(e) => e.stopPropagation()}
                  value={options.height}
                />
              </Form.Item>
              <Form.Item className={styles['flex-child']} label={t.text_margin}>
                <InputNumber
                  className={styles['w-100']}
                  max={100}
                  onChange={(textMargin) => setOptions({ ...options, textMargin })}
                  onKeyDown={(e) => e.stopPropagation()}
                  value={options.textMargin}
                />
              </Form.Item>

              <Form.Item className={styles['flex-child']}>
                <Checkbox
                  checked={isInvert}
                  onChange={() => {
                    const [black, white] = ['#000000', '#ffffff'];

                    setIsInvert(!isInvert);
                    setOptions({
                      ...options,
                      background: isInvert ? white : black,
                      lineColor: isInvert ? black : white,
                    });
                  }}
                >
                  {t.invert_color}
                </Checkbox>
              </Form.Item>
            </Flex>

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
              </Form.Item>

              <Flex justify="space-between">
                <Form.Item>
                  <Radio.Group
                    onChange={(e) => setOptions({ ...options, textAlign: e.target.value })}
                    options={[
                      { label: <AlignLeftOutlined />, value: 'left' },
                      { label: <AlignCenterOutlined />, value: 'center' },
                      { label: <AlignRightOutlined />, value: 'right' },
                    ]}
                    optionType="button"
                    value={options.textAlign}
                  />
                </Form.Item>

                <Flex gap={4}>
                  <Form.Item>
                    <Button
                      className={isBold ? styles['check-text-option'] : ''}
                      defaultChecked={isBold}
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
                  </Form.Item>

                  <Form.Item>
                    <Button
                      className={isItalic ? styles['check-text-option'] : ''}
                      defaultChecked={isItalic}
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
                  </Form.Item>
                </Flex>
              </Flex>

              <Form.Item className={styles['flex-child']}>
                <Checkbox onChange={(e) => setOptions({ ...options, displayValue: !e.target.checked })}>
                  {t.hide_text}
                </Checkbox>
              </Form.Item>
            </Flex>
          </Flex>
        </Form>
      </ConfigProvider>
    </div>
  );
};

export default BarcodeGenerator;
