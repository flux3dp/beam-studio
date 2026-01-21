import React, { useEffect, useMemo, useState } from 'react';

import { ColorPicker as AntdColorPicker, Button } from 'antd';
import type { Color } from 'antd/es/color-picker';
import classNames from 'classnames';
import { match } from 'ts-pattern';

import colorConstants, { CMYK, objectsColorPresets } from '@core/app/constants/color-constants';
import useI18n from '@core/helpers/useI18n';

import styles from './ColorPicker.module.scss';

interface Props {
  allowClear?: boolean;
  colorPresets?: 'cmyk' | 'cmykw' | 'objects';
  disabled?: boolean;
  initColor: string;
  onChange: (color: string) => void;
  triggerSize?: 'middle' | 'small';
  triggerType?: 'fill' | 'stroke';
}

const ColorPicker = ({
  allowClear,
  colorPresets = 'objects',
  disabled = false,
  initColor,
  onChange,
  triggerSize = 'middle',
  triggerType = 'fill',
}: Props): React.JSX.Element => {
  const [color, setColor] = useState<string>(initColor);
  const [open, setOpen] = useState<boolean>(false);
  const lang = useI18n().alert;
  const isForPrinter = useMemo(() => colorPresets === 'cmyk' || colorPresets === 'cmykw', [colorPresets]);

  useEffect(() => {
    setColor(initColor);
  }, [initColor]);

  const panelRender = (panel: React.ReactNode) => {
    const presets = match(colorPresets)
      .with('cmykw', () => colorConstants.printingLayerColor)
      .with('cmyk', () => CMYK)
      .otherwise(() => objectsColorPresets);

    return (
      <div onClick={(e) => e.stopPropagation()}>
        <div className={styles.preset}>
          {allowClear && (
            <div>
              <div
                className={classNames(styles['preset-block'], styles.clear, {
                  [styles.checked]: color === 'none',
                })}
                onClick={() => setColor('none')}
              />
            </div>
          )}
          {presets.map((preset) => (
            <div
              className={classNames(styles['preset-block'], styles.color, {
                [styles.checked]: preset === color,
                [styles.printing]: isForPrinter,
              })}
              key={preset}
              onClick={() => setColor(preset)}
            >
              <div className={styles.inner} style={{ backgroundColor: preset }} />
            </div>
          ))}
        </div>
        {!isForPrinter && <div className={classNames(styles.panel, { [styles.clear]: color === 'none' })}>{panel}</div>}
        <div className={styles.footer}>
          <Button
            className={styles.btn}
            onClick={() => {
              setOpen(false);
              onChange(color);
            }}
            type="primary"
          >
            {lang.ok}
          </Button>
          <Button
            className={styles.btn}
            onClick={() => {
              setOpen(false);
              setColor(initColor);
            }}
            type="default"
          >
            {lang.cancel}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <AntdColorPicker
        disabled={disabled}
        disabledAlpha
        onChange={(c: Color) => setColor(c.toHexString())}
        onOpenChange={(o: boolean) => setOpen(o)}
        open={open}
        panelRender={panelRender}
        placement="bottomLeft"
        rootClassName={classNames({ [styles['no-panel']]: isForPrinter })}
        value={color === 'none' ? '#000000' : color}
      >
        <div
          className={classNames(styles.trigger, {
            [styles.open]: open,
            [styles.small]: triggerSize === 'small',
          })}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={classNames(styles.color, { [styles.clear]: initColor === 'none' })}
            style={{ background: initColor }}
          >
            {triggerType === 'stroke' && (
              <div
                className={classNames(styles['stroke-inner'], {
                  [styles.clear]: initColor === 'none',
                })}
              />
            )}
          </div>
        </div>
      </AntdColorPicker>
    </div>
  );
};

export default ColorPicker;
