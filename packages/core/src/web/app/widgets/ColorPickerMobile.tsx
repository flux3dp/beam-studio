import React, { useEffect, useState } from 'react';

import { Button, ColorPicker, Input, Popover } from 'antd';
import type { Color } from 'antd/es/color-picker';
import classNames from 'classnames';

import ColorBlock from '@core/app/components/beambox/RightPanel/ColorBlock';
import { getOS } from '@core/helpers/getOS';
import isWeb from '@core/helpers/is-web';
import useI18n from '@core/helpers/useI18n';

import styles from './ColorPicker.module.scss';

interface Props {
  color: string;
  onChange: (color: string, actual?: boolean) => void;
  onClose: () => void;
  open: boolean;
}

const getDisplayValue = (c: string) => (!c || c === 'none' ? '00000000' : c.replace('#', '').toUpperCase());
const isHex = (c: string) => c && c.match(/^[A-Fa-f0-9]{6}$/);
const isWhiteTopBar = getOS() !== 'MacOS' && !isWeb();

const ColorPickerMobile = ({ color, onChange, onClose, open }: Props): React.JSX.Element => {
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
          maxLength={6}
          onBlur={() => setDisplayValue(getDisplayValue(color))}
          onChange={(e) => {
            const newValue = e.target.value;

            setDisplayValue(newValue);

            if (isHex(newValue)) {
              previewColor(`#${newValue}`);
            }
          }}
          prefix={<span className={styles.prefix}>#</span>}
          size="small"
          value={displayValue}
        />
        <Button className={styles.btn} onClick={onClose} shape="round" type="default">
          {lang.cancel}
        </Button>
        <Button
          className={styles.btn}
          onClick={() => {
            onChange(color);
            onClose();
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
    <>
      <ColorPicker
        arrow={false}
        disabledAlpha
        getPopupContainer={(triggerNode) => triggerNode.parentElement}
        onChange={(c: Color) => previewColor(c.toHexString())}
        open={open}
        panelRender={panelRender}
        rootClassName={styles['mobile-container']}
        value={isClear ? '#000000' : color}
      >
        <div />
      </ColorPicker>
      <Popover
        arrow={false}
        content={
          <>
            <div
              className={classNames(styles['top-mask'], { [styles.white]: isWhiteTopBar })}
              onClick={() => onClose()}
            />
            <div className={styles['bottom-mask']} onClick={() => onClose()} />
          </>
        }
        open={open}
        rootClassName={styles['mask-container']}
      />
    </>
  );
};

export default ColorPickerMobile;
