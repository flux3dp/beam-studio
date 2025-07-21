import React from 'react';

function SettingFormItem({ children, id, label, options, tooltip, url }: any) {
  return (
    <div>
      mock-form-item id:{id}
      label:{label}
      url:{url}
      {tooltip && `tooltip:${tooltip}`}
      options:{JSON.stringify(options)}
      {children}
    </div>
  );
}

export default SettingFormItem;
