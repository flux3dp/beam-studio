import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button, ColorPicker, Input } from 'antd';
import { match } from 'ts-pattern';

import ColorBlock from '@core/app/components/beambox/RightPanel/ColorBlock';
import Row from '@core/app/components/beambox/RightPanel/common/Row';
import colorConstants, { CMYK, objectsColorPresets } from '@core/app/constants/color-constants';
import ObjectPanelIcons from '@core/app/icons/object-panel/ObjectPanelIcons';
import { setMouseMode } from '@core/app/stores/canvas/utils/mouseMode';
import { setStorage, useStorageStore } from '@core/app/stores/storageStore';
import useI18n from '@core/helpers/useI18n';

import styles from './ColorPicker.module.scss';

const emptyColors: string[] = [];

interface Props {
  allowClear?: boolean;
  color: string;
  colorPresets?: 'cmyk' | 'cmykw' | 'objects';
  onChange: (color: string, actual?: boolean) => void;
  triggerType?: 'fill' | 'stroke';
}

const getFormattedValue = (c: string) => (!c || c === 'none' ? 'none' : c.toUpperCase());
const formatForInput = (c: string) => (!c || c === 'none' ? '00000000' : c.replace('#', '').toUpperCase());
const isHex = (c: string) => c && c.match(/^[A-Fa-f0-9]{6}$/);

const ColorPickerMobile = ({
  allowClear,
  color,
  colorPresets = 'objects',
  onChange,
  triggerType = 'fill',
}: Props): React.JSX.Element => {
  const lang = useI18n().alert;
  const customColors = useStorageStore((state) => state.custom_colors || emptyColors);
  const presetColors = useMemo(
    () =>
      match(colorPresets)
        .with('cmykw', () => colorConstants.printingLayerColor)
        .with('cmyk', () => CMYK)
        .otherwise(() => objectsColorPresets),
    [colorPresets],
  );
  const isStroke = useMemo(() => triggerType === 'stroke', [triggerType]);
  const [formattedValue, setFormattedValue] = useState(getFormattedValue(color));
  const [displayValue, setDisplayValue] = useState(color);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isSelectingCustomColor, setIsSelectingCustomColor] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const isClear = formattedValue === 'none';
  const previewRef = useRef({ newColor: '', origColor: '' });

  const previewColor = useCallback(
    (c: string) => {
      onChange(c, false);
      setDisplayValue(c);
      previewRef.current.newColor = c;
    },
    [onChange],
  );

  const applyColor = useCallback(
    (c: string) => {
      onChange(previewRef.current.origColor, false);
      onChange(c, true);
      previewRef.current.origColor = c;
      previewRef.current.newColor = c;
    },
    [onChange],
  );

  const startPreviewMode = useCallback((c: string) => {
    setMouseMode('preview_color');
    previewRef.current = { newColor: c, origColor: c };
    setShowColorPicker(true);
  }, []);

  const endPreviewMode = useCallback(() => {
    const { newColor, origColor } = previewRef.current;

    if (origColor !== newColor) previewColor(origColor);

    setMouseMode('select');
    setShowColorPicker(false);
  }, [previewColor]);

  useEffect(() => {
    setDisplayValue(color);
    setFormattedValue(getFormattedValue(color));
  }, [color]);

  useEffect(() => () => endPreviewMode(), [endPreviewMode]);

  const panelRender = (panel: React.ReactNode) => (
    <div className={styles.panel}>
      {panel}
      <div className={styles.footer}>
        <Button
          className={styles.btn}
          onClick={() => {
            previewColor(previewRef.current.origColor);
            endPreviewMode();
          }}
          shape="round"
          type="default"
        >
          {lang.cancel}
        </Button>
        <Button
          className={styles.btn}
          onClick={() => {
            applyColor(previewRef.current.newColor);
            endPreviewMode();
          }}
          shape="round"
          type="primary"
        >
          {lang.ok}
        </Button>
      </div>
    </div>
  );

  return (
    <div>
      <div className={styles.preset}>
        {allowClear && (
          <ColorBlock
            active={formattedValue === 'none'}
            className={styles['preset-block']}
            color="none"
            onClick={() => {
              setIsSelectingCustomColor(false);
              applyColor('none');
            }}
            stroke={isStroke}
          />
        )}
        {presetColors.map((preset) => (
          <ColorBlock
            active={!isSelectingCustomColor && formattedValue === preset}
            className={styles['preset-block']}
            color={preset}
            key={preset}
            onClick={() => {
              setIsSelectingCustomColor(false);
              applyColor(preset);
            }}
            stroke={isStroke}
          />
        ))}
        {customColors.map((preset) => (
          <ColorBlock
            active={isSelectingCustomColor && formattedValue === preset}
            className={styles['preset-block']}
            color={preset}
            key={preset}
            onClick={() => {
              setIsSelectingCustomColor(true);
              applyColor(preset);
            }}
            stroke={isStroke}
          />
        ))}
        <Button
          className={styles['control-button']}
          danger
          disabled={!isSelectingCustomColor}
          icon={<ObjectPanelIcons.Minus viewBox="6 6 20 20" />}
          onClick={() => {
            setStorage(
              'custom_colors',
              customColors.filter((c) => c !== formattedValue),
            );
            setIsSelectingCustomColor(false);
          }}
        />
      </div>
      <Row>
        <ColorPicker
          arrow={false}
          disabledAlpha
          onChange={(c) => previewColor(c.toHexString())}
          onOpenChange={(open) => {
            if (open) startPreviewMode(formattedValue);
            else endPreviewMode();
          }}
          open={showColorPicker}
          panelRender={panelRender}
          value={displayValue}
        >
          <ColorBlock active={showColorPicker} color={color} stroke={isStroke} />
        </ColorPicker>
        <Input
          className={styles.input}
          maxLength={isClear ? 8 : 6}
          onBlur={() => {
            setDisplayValue(color);
            setIsTyping(false);
          }}
          onChange={(e) => {
            const newValue = e.target.value;
            const newHex = `#${newValue}`;

            setIsTyping(true);
            setDisplayValue(newHex);

            if (isHex(newValue)) {
              applyColor(newHex);
              setIsTyping(false);
            }
          }}
          prefix={<span className={styles.prefix}>#</span>}
          size="small"
          value={formatForInput(showColorPicker ? color : displayValue)}
        />
        <Button
          className={styles['control-button']}
          disabled={isTyping || presetColors.includes(formattedValue) || customColors.includes(formattedValue)}
          icon={<ObjectPanelIcons.Plus viewBox="6 6 20 20" />}
          onClick={() => {
            setStorage('custom_colors', [...customColors, formattedValue]);
            setIsSelectingCustomColor(true);
          }}
        />
      </Row>
    </div>
  );
};

export default memo(ColorPickerMobile);
