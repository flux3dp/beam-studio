import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { Color } from 'antd/es/color-picker';
import { ColorPicker, Button, Input, Popover } from 'antd';

import ColorBlock from 'app/components/beambox/right-panel/ColorBlock';
import isWeb from 'helpers/is-web';
import useI18n from 'helpers/useI18n';

import styles from './ColorPicker.module.scss';

interface Props {
  color: string;
  onChange: (color: string, actual?: boolean) => void;
  open: boolean;
  onClose: () => void;
}

const getDisplayValue = (c: string) =>
  !c || c === 'none' ? '00000000' : c.replace('#', '').toUpperCase();
const isHex = (c: string) => c && c.match(/^[A-Fa-f0-9]{6}$/);
const isWhiteTopBar = window.os !== 'MacOS' && !isWeb();

const ColorPickerMobile = ({ color, onChange, open, onClose }: Props): JSX.Element => {
  const lang = useI18n().alert;
  const previewColor = (c: string) => onChange(c, false);
  const [displayValue, setDisplayValue] = useState(getDisplayValue(color));
  const isClear = color === 'none';
  useEffect(() => {
    setDisplayValue(getDisplayValue(color));
  }, [color]);

  const panelRender = (panel: React.ReactNode) => (
    <div>
      <div className={classNames(styles.panel, styles['with-clear'])}>{panel}</div>
      <ColorBlock
        className={classNames(styles['clear-button'], { [styles.active]: isClear })}
        color="none"
        onClick={() => previewColor('none')}
      />
      <div className={styles.footer}>
        <Input
          className={styles.input}
          size="small"
          value={displayValue}
          prefix={<span className={styles.prefix}>#</span>}
          maxLength={6}
          onChange={(e) => {
            const newValue = e.target.value;
            setDisplayValue(newValue);
            if (isHex(newValue)) {
              previewColor(`#${newValue}`);
            }
          }}
          onBlur={() => setDisplayValue(getDisplayValue(color))}
        />
        <Button shape="round" type="default" className={styles.btn} onClick={onClose}>
          {lang.cancel}
        </Button>
        <Button
          shape="round"
          type="primary"
          className={styles.btn}
          onClick={() => {
            onChange(color);
            onClose();
          }}
        >
          {lang.ok}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <ColorPicker
        rootClassName={styles['mobile-container']}
        getPopupContainer={(triggerNode) => triggerNode.parentElement}
        open={open}
        value={isClear ? '#000000' : color}
        onChange={(c: Color) => previewColor(c.toHexString())}
        panelRender={panelRender}
        arrow={false}
        disabledAlpha
      >
        <div />
      </ColorPicker>
      <Popover
        rootClassName={styles['mask-container']}
        open={open}
        content={
          <>
            <div
              className={classNames(styles['top-mask'], { [styles.white]: isWhiteTopBar })}
              onClick={() => onClose()}
            />
            <div className={styles['bottom-mask']} onClick={() => onClose()} />
          </>
        }
        arrow={false}
      />
    </>
  );
};

export default ColorPickerMobile;
