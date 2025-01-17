import classNames from 'classnames';
import Icon, { DownOutlined } from '@ant-design/icons';
import React, { useContext, useEffect, useMemo, useRef } from 'react';
import { Button, Divider, Popover } from 'antd-mobile';

import ObjectPanelIcons from 'app/icons/object-panel/ObjectPanelIcons';
import storage from 'implementations/storage';
import units from 'helpers/units';
import { ObjectPanelContext } from 'app/views/beambox/Right-Panels/contexts/ObjectPanelContext';

import styles from './ObjectPanelItem.module.scss';

interface Props {
  id: string;
  content: JSX.Element;
  label?: string | JSX.Element;
  onClick?: () => void;
  disabled?: boolean;
  autoClose?: boolean;
}
const ObjectPanelItem = ({
  id,
  content,
  label,
  onClick,
  disabled,
  autoClose = true,
}: Props): JSX.Element => {
  const context = useContext(ObjectPanelContext);
  const { activeKey, updateActiveKey } = context;
  if (disabled) {
    return null;
  }
  return (
    <div
      id={id}
      className={classNames(styles['object-panel-item'], {
        [styles.active]: activeKey === id,
      })}
      onClick={async () => {
        updateActiveKey(id);
        await onClick?.();
        if (autoClose) setTimeout(() => updateActiveKey(null), 300);
      }}
    >
      <div className={styles.main}>{content}</div>
      {label && <div className={styles.label}>{label}</div>}
    </div>
  );
};

interface NumberItemProps {
  id: string;
  value: number;
  min?: number;
  max?: number;
  updateValue?: (val: number) => void;
  label?: string | JSX.Element;
  unit?: string;
  decimal?: number;
}
const ObjectPanelNumber = ({
  id,
  label,
  value = 0,
  min = Number.MIN_SAFE_INTEGER,
  max = Number.MAX_SAFE_INTEGER,
  updateValue,
  unit = 'mm',
  decimal,
}: NumberItemProps): JSX.Element => {
  const context = useContext(ObjectPanelContext);
  const { activeKey } = context;
  const isActive = activeKey === id;
  const shouldConvert2Inch = useMemo(
    () => unit === 'mm' && storage.get('default-units') === 'inches',
    [unit]
  );
  // for unit conversion
  const fakeUnit = shouldConvert2Inch ? 'inch' : 'mm';
  const defaultPrecision = shouldConvert2Inch ? 4 : 2;
  const precision = decimal === undefined ? defaultPrecision : decimal;
  const valueInUnit = (+units.convertUnit(value, fakeUnit, 'mm').toFixed(precision)).toString();
  const [displayValue, setDisplayValue] = React.useState(valueInUnit);
  const [hasInput, setHasInput] = React.useState(false);
  const onChange = (newValue: string) => {
    setDisplayValue(newValue);
    updateValue(units.convertUnit(+newValue || 0, 'mm', fakeUnit));
    if (!hasInput) setHasInput(true);
  };
  React.useEffect(() => {
    if (+displayValue !== +valueInUnit) {
      setDisplayValue(valueInUnit);
    } else if (!isActive) {
      let safeValue = Math.min(value, max);
      safeValue = Math.max(safeValue, min);
      if (safeValue !== value) updateValue(safeValue);
      else if (!displayValue) setDisplayValue('0');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayValue, value, valueInUnit, isActive]);
  const isKeyDisabled = (key: string) => {
    if (key === '.') {
      return displayValue.includes('.') || precision === 0;
    }
    return displayValue.split('.')[1]?.length >= precision;
  };
  const NumberKeyboard = () => (
    <>
      <div className={styles['input-keys']}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'].map((key) => (
          <Button
            key={key}
            shape="rounded"
            disabled={isKeyDisabled(key)}
            onClick={() => {
              if (hasInput) onChange(displayValue + key);
              else if (key === '.') onChange('0.');
              else onChange(key);
            }}
          >
            {key}
          </Button>
        ))}
        <Button
          shape="rounded"
          onClick={() => onChange(displayValue.substring(0, displayValue.length - 1))}
        >
          <Icon className={styles.icon} component={ObjectPanelIcons.Delete} />
        </Button>
      </div>
      <div className={styles['step-buttons']}>
        <Button shape="rounded" onClick={() => onChange((+displayValue - 1).toString())}>
          <Icon className={styles.icon} component={ObjectPanelIcons.Minus} />
        </Button>
        <Button shape="rounded" onClick={() => onChange((+displayValue + 1).toString())}>
          <Icon className={styles.icon} component={ObjectPanelIcons.Plus} />
        </Button>
      </div>
    </>
  );
  return (
    <Popover className={styles['number-keyboard']} visible={isActive} content={<NumberKeyboard />}>
      <ObjectPanelItem
        id={id}
        label={label}
        content={
          <Button className={styles['number-item']} shape="rounded" size="mini" fill="outline">
            {displayValue}
            {unit === 'degree' && <>&deg;</>}
          </Button>
        }
        onClick={() => setHasInput(false)}
        autoClose={false}
      />
    </Popover>
  );
};

interface ActionListProps {
  id: string;
  actions: {
    icon: JSX.Element;
    label: string;
    onClick: () => void;
    disabled?: boolean;
  }[];
  content: JSX.Element;
  label?: string;
  disabled?: boolean;
}
const ObjectPanelActionList = ({
  id,
  actions,
  content,
  label,
  disabled,
}: ActionListProps): JSX.Element => {
  const context = useContext(ObjectPanelContext);
  const { activeKey } = context;
  const isActive = activeKey === id;
  const [activeAction, setActiveAction] = React.useState<string[]>([]);
  const ActionList = () => (
    <div>
      {actions.map((action) => (
        <div
          key={action.label}
          className={classNames(styles.action, {
            [styles.disabled]: action.disabled,
            [styles.active]: activeAction.includes(action.label),
          })}
          onClick={() => {
            if (!action.disabled) {
              setActiveAction([...activeAction, action.label]);
              setTimeout(
                () =>
                  setActiveAction((value) => {
                    const idx = value.indexOf(action.label);
                    if (idx !== -1) {
                      value.splice(idx, 1);
                    }
                    return [...value];
                  }),
                1000
              );
              action.onClick();
            }
          }}
        >
          {action.icon}
          <span className={styles.label}>{action.label}</span>
        </div>
      ))}
    </div>
  );

  return (
    <Popover className={styles['action-list']} visible={isActive} content={<ActionList />}>
      <ObjectPanelItem
        id={id}
        content={content}
        label={label}
        disabled={disabled}
        autoClose={false}
      />
    </Popover>
  );
};

interface SelectProps {
  id: string;
  selected: {
    label: string | JSX.Element;
    value: string | number;
  };
  options: {
    label: string | JSX.Element;
    value: string | number;
  }[];
  onChange: (val: string | number) => void | Promise<void>;
  label?: string;
}
const ObjectPanelSelect = ({
  id,
  selected = { value: '', label: '' },
  options,
  onChange,
  label,
}: SelectProps): JSX.Element => {
  const context = useContext(ObjectPanelContext);
  const { activeKey, updateActiveKey } = context;
  const isActive = activeKey === id;
  const ref = useRef(null);
  const SelectOptions = () => (
    <div id={`${id}-options`} className={styles['select-options']}>
      {options.map((option) => (
        <div
          key={option.value}
          className={classNames(styles.option, {
            [styles.active]: selected.value === option.value,
          })}
          onClick={async () => {
            await onChange(option.value);
            updateActiveKey(null);
          }}
        >
          <span>{option.label}</span>
        </div>
      ))}
    </div>
  );
  useEffect(() => {
    if (ref.current && isActive) {
      const ele = document.querySelector(`#${id}-options .${styles.active}`) as HTMLElement;
      if (ele) {
        ele.parentElement.scrollTop = ele.offsetTop - 20;
      }
    }
  }, [id, isActive, ref]);

  return (
    <Popover ref={ref} className={styles.select} visible={isActive} content={<SelectOptions />}>
      <ObjectPanelItem
        id={id}
        content={
          <Button className={styles['select-button']} shape="rounded" size="mini" fill="outline">
            <div className={styles['selected-content']}>
              {selected.label}
              <DownOutlined />
            </div>
          </Button>
        }
        label={label}
        disabled={options.length <= 1}
        autoClose={false}
      />
    </Popover>
  );
};

const ObjectPanelDivider = (): JSX.Element => (
  <Divider className={styles.divider} direction="vertical" />
);

const ObjectPanelMask = (): JSX.Element => {
  const { activeKey, updateActiveKey } = useContext(ObjectPanelContext);
  return (
    <div
      className={classNames(styles.mask, { [styles.hide]: activeKey === null })}
      onClick={() => updateActiveKey(null)}
    />
  );
};

export default {
  ActionList: ObjectPanelActionList,
  Divider: ObjectPanelDivider,
  Item: ObjectPanelItem,
  Number: ObjectPanelNumber,
  Select: ObjectPanelSelect,
  Mask: ObjectPanelMask,
};
