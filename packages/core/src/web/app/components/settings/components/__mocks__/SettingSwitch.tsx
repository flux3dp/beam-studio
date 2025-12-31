import React from 'react';

function SettingSwitch({ checked, disabled, id, label, onChange, tooltip, url }: any) {
  return (
    <div>
      mock-switch-control id:{id}
      label:{label}
      url:{url}
      {tooltip && `tooltip:${tooltip}`}
      checked:{String(checked)}
      disabled:{String(disabled)}
      <input
        checked={checked}
        className="switch-control"
        disabled={disabled}
        id={id}
        onClick={() => onChange(!checked)}
        readOnly
        type="checkbox"
      />
    </div>
  );
}

export default SettingSwitch;
