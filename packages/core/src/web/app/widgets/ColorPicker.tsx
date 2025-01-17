import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { Color } from 'antd/es/color-picker';
import { ColorPicker as AntdColorPicker, Button } from 'antd';

import colorConstants, { objectsColorPresets } from 'app/constants/color-constants';
import useI18n from 'helpers/useI18n';

import styles from './ColorPicker.module.scss';

interface Props {
  allowClear?: boolean;
  initColor: string;
  triggerType?: 'fill' | 'stroke';
  triggerSize?: 'small' | 'middle';
  onChange: (color: string) => void;
  disabled?: boolean;
  forPrinter?: boolean;
}

const ColorPicker = ({
  allowClear,
  initColor,
  triggerType = 'fill',
  triggerSize = 'middle',
  onChange,
  disabled = false,
  forPrinter = false,
}: Props): JSX.Element => {
  const [color, setColor] = useState<string>(initColor);
  const [open, setOpen] = useState<boolean>(false);
  const lang = useI18n().alert;

  useEffect(() => {
    setColor(initColor);
  }, [initColor]);

  const panelRender = (panel: React.ReactNode) => {
    const colorPresets = forPrinter ? colorConstants.printingLayerColor : objectsColorPresets;
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
          {colorPresets.map((preset) => (
            <div
              key={preset}
              className={classNames(styles['preset-block'], styles.color, {
                [styles.checked]: preset === color,
                [styles.printing]: forPrinter,
              })}
              onClick={() => setColor(preset)}
            >
              <div className={styles.inner} style={{ backgroundColor: preset }} />
            </div>
          ))}
        </div>
        {!forPrinter && (
          <div className={classNames(styles.panel, { [styles.clear]: color === 'none' })}>
            {panel}
          </div>
        )}
        <div className={styles.footer}>
          <Button
            type="primary"
            className={styles.btn}
            onClick={() => {
              setOpen(false);
              onChange(color);
            }}
          >
            {lang.ok}
          </Button>
          <Button
            type="default"
            className={styles.btn}
            onClick={() => {
              setOpen(false);
              setColor(initColor);
            }}
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
        rootClassName={classNames({ [styles['no-panel']]: forPrinter })}
        placement="bottomLeft"
        disabledAlpha
        disabled={disabled}
        open={open}
        onOpenChange={(o: boolean) => setOpen(o)}
        value={color === 'none' ? '#000000' : color}
        onChangeComplete={(c: Color) => setColor(c.toHexString())}
        panelRender={panelRender}
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
