import React from 'react';

function SettingSelect({ id, label, onChange, options, url }: any) {
  return (
    <div>
      mock-select-control id:{id}
      label:{label}
      url:{url}
      options:{JSON.stringify(options)}
      <input
        className="select-control"
        id={id}
        onChange={(e) =>
          onChange(['false', 'true'].includes(e.target.value) ? e.target.value === 'true' : e.target.value)
        }
      />
    </div>
  );
}

export default SettingSelect;
