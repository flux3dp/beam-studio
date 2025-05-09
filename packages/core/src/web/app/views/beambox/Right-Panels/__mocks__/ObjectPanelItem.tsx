/* eslint-disable reactRefresh/only-export-components */
import React from 'react';

const ObjectPanelItem = ({ autoClose = true, content, disabled, id, label, onClick }: any) => {
  return (
    <div>
      mock-object-panel-item
      <br />
      id:{id}
      label:{label}
      disabled:{disabled ? 'true' : 'false'}
      autoClose:{autoClose ? 'true' : 'false'}
      content:{content}
      <button onClick={onClick} />
    </div>
  );
};

const ObjectPanelNumber = ({
  decimal,
  hasMultiValue = false,
  id,
  label,
  max = Number.MAX_SAFE_INTEGER,
  min = Number.MIN_SAFE_INTEGER,
  unit = 'mm',
  updateValue,
  value = 0,
}: any) => {
  return (
    <div>
      mock-object-panel-number-item
      <br />
      id:{id}
      label:{label}
      min:{min}
      max:{max}
      decimal:{decimal}
      value:{value}
      unit:{unit}
      hasMultiValue:{hasMultiValue ? 'true' : 'false'}
      <input onChange={(e) => updateValue?.(+e.target.value)} />
    </div>
  );
};

const ObjectPanelActionList = ({ actions, content, disabled, id, label }: any) => {
  return (
    <div>
      mock-object-panel-action-list
      <br />
      id:{id}
      label:{label}
      disabled:{disabled ? 'true' : 'false'}
      content:{content}
      actions:
      {actions.map((action: any) => (
        <div key={action.label}>
          disabled:{action.disabled ? 'true' : 'false'}
          {action.icon}
          <span>{action.label}</span>
          <button onClick={action.onClick} />
        </div>
      ))}
    </div>
  );
};

const ObjectPanelSelect = ({ id, label, onChange, options, selected }: any) => {
  return (
    <div>
      mock-object-panel-select
      <br />
      id:{id}
      label:{label}
      selected:
      {selected ? (
        <div>
          label:{selected.label}
          value:{selected.value}
        </div>
      ) : (
        'none'
      )}
      options:
      {options.map((option: any) => (
        <div key={option.label}>
          type:{option.type}
          label:{option.label}
          value:{option.value}
          {option.value !== undefined && <button onClick={() => onChange(option.value, option)}>{option.label}</button>}
        </div>
      ))}
    </div>
  );
};

const ObjectPanelDivider = 'mock-object-panel-divider';

const ObjectPanelMask = 'mock-object-panel-mask';

export default {
  ActionList: ObjectPanelActionList,
  Divider: ObjectPanelDivider,
  Item: ObjectPanelItem,
  Mask: ObjectPanelMask,
  Number: ObjectPanelNumber,
  Select: ObjectPanelSelect,
};
