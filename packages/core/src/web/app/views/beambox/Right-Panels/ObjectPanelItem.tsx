import React, { useContext, useEffect, useMemo, useRef } from 'react';

import Icon, { DownOutlined } from '@ant-design/icons';
import { Button, Divider, Popover } from 'antd-mobile';
import classNames from 'classnames';

import ObjectPanelIcons from '@core/app/icons/object-panel/ObjectPanelIcons';
import { ObjectPanelContext } from '@core/app/views/beambox/Right-Panels/contexts/ObjectPanelContext';
import units from '@core/helpers/units';
import storage from '@core/implementations/storage';

import styles from './ObjectPanelItem.module.scss';

interface Props {
  autoClose?: boolean;
  content: React.JSX.Element;
  disabled?: boolean;
  id: string;
  label?: React.JSX.Element | string;
  onClick?: () => void;
}

const ObjectPanelItem = ({ autoClose = true, content, disabled, id, label, onClick }: Props): React.JSX.Element => {
  const context = useContext(ObjectPanelContext);
  const { activeKey, updateActiveKey } = context;

  if (disabled) {
    return null;
  }

  return (
    <div
      className={classNames(styles['object-panel-item'], {
        [styles.active]: activeKey === id,
      })}
      id={id}
      onClick={async () => {
        updateActiveKey(id);
        await onClick?.();

        if (autoClose) {
          setTimeout(() => updateActiveKey(null), 300);
        }
      }}
    >
      <div className={styles.main}>{content}</div>
      {label && <div className={styles.label}>{label}</div>}
    </div>
  );
};

interface NumberItemProps {
  decimal?: number;
  id: string;
  label?: React.JSX.Element | string;
  max?: number;
  min?: number;
  unit?: string;
  updateValue?: (val: number) => void;
  value: number;
}

const ObjectPanelNumber = ({
  decimal,
  id,
  label,
  max = Number.MAX_SAFE_INTEGER,
  min = Number.MIN_SAFE_INTEGER,
  unit = 'mm',
  updateValue,
  value = 0,
}: NumberItemProps): React.JSX.Element => {
  const context = useContext(ObjectPanelContext);
  const { activeKey } = context;
  const isActive = activeKey === id;
  const shouldConvert2Inch = useMemo(() => unit === 'mm' && storage.get('default-units') === 'inches', [unit]);
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

    if (!hasInput) {
      setHasInput(true);
    }
  };

  React.useEffect(() => {
    if (+displayValue !== +valueInUnit) {
      setDisplayValue(valueInUnit);
    } else if (!isActive) {
      let safeValue = Math.min(value, max);

      safeValue = Math.max(safeValue, min);

      if (safeValue !== value) {
        updateValue(safeValue);
      } else if (!displayValue) {
        setDisplayValue('0');
      }
    }
    // eslint-disable-next-line hooks/exhaustive-deps
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
            disabled={isKeyDisabled(key)}
            key={key}
            onClick={() => {
              if (hasInput) {
                onChange(displayValue + key);
              } else if (key === '.') {
                onChange('0.');
              } else {
                onChange(key);
              }
            }}
            shape="rounded"
          >
            {key}
          </Button>
        ))}
        <Button onClick={() => onChange(displayValue.substring(0, displayValue.length - 1))} shape="rounded">
          <Icon className={styles.icon} component={ObjectPanelIcons.Delete} />
        </Button>
      </div>
      <div className={styles['step-buttons']}>
        <Button onClick={() => onChange((+displayValue - 1).toString())} shape="rounded">
          <Icon className={styles.icon} component={ObjectPanelIcons.Minus} />
        </Button>
        <Button onClick={() => onChange((+displayValue + 1).toString())} shape="rounded">
          <Icon className={styles.icon} component={ObjectPanelIcons.Plus} />
        </Button>
      </div>
    </>
  );

  return (
    <Popover className={styles['number-keyboard']} content={<NumberKeyboard />} visible={isActive}>
      <ObjectPanelItem
        autoClose={false}
        content={
          <Button className={styles['number-item']} fill="outline" shape="rounded" size="mini">
            {displayValue}
            {unit === 'degree' && <>&deg;</>}
          </Button>
        }
        id={id}
        label={label}
        onClick={() => setHasInput(false)}
      />
    </Popover>
  );
};

interface ActionListProps {
  actions: Array<{
    disabled?: boolean;
    icon: React.JSX.Element;
    label: string;
    onClick: () => void;
  }>;
  content: React.JSX.Element;
  disabled?: boolean;
  id: string;
  label?: string;
}

const ObjectPanelActionList = ({ actions, content, disabled, id, label }: ActionListProps): React.JSX.Element => {
  const context = useContext(ObjectPanelContext);
  const { activeKey } = context;
  const isActive = activeKey === id;
  const [activeAction, setActiveAction] = React.useState<string[]>([]);
  const ActionList = () => (
    <div>
      {actions.map((action) => (
        <div
          className={classNames(styles.action, {
            [styles.active]: activeAction.includes(action.label),
            [styles.disabled]: action.disabled,
          })}
          key={action.label}
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
                1000,
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
    <Popover className={styles['action-list']} content={<ActionList />} visible={isActive}>
      <ObjectPanelItem autoClose={false} content={content} disabled={disabled} id={id} label={label} />
    </Popover>
  );
};

interface SelectProps {
  id: string;
  label?: string;
  onChange: (val: number | string) => Promise<void> | void;
  options: Array<{
    label: React.JSX.Element | string;
    value: number | string;
  }>;
  selected: {
    label: React.JSX.Element | string;
    value: number | string;
  };
}

const ObjectPanelSelect = ({
  id,
  label,
  onChange,
  options,
  selected = { label: '', value: '' },
}: SelectProps): React.JSX.Element => {
  const context = useContext(ObjectPanelContext);
  const { activeKey, updateActiveKey } = context;
  const isActive = activeKey === id;
  const ref = useRef(null);
  const SelectOptions = () => (
    <div className={styles['select-options']} id={`${id}-options`}>
      {options.map((option) => (
        <div
          className={classNames(styles.option, {
            [styles.active]: selected.value === option.value,
          })}
          key={option.value}
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
    <Popover className={styles.select} content={<SelectOptions />} ref={ref} visible={isActive}>
      <ObjectPanelItem
        autoClose={false}
        content={
          <Button className={styles['select-button']} fill="outline" shape="rounded" size="mini">
            <div className={styles['selected-content']}>
              {selected.label}
              <DownOutlined />
            </div>
          </Button>
        }
        disabled={options.length <= 1}
        id={id}
        label={label}
      />
    </Popover>
  );
};

const ObjectPanelDivider = (): React.JSX.Element => <Divider className={styles.divider} direction="vertical" />;

const ObjectPanelMask = (): React.JSX.Element => {
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
  Mask: ObjectPanelMask,
  Number: ObjectPanelNumber,
  Select: ObjectPanelSelect,
};
