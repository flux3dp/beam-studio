import React from 'react';

function SettingFormItem({ children, id, label, options, url }: any) {
  return (
    <div>
      mock-form-item id:{id}
      label:{label}
      url:{url}
      options:{JSON.stringify(options)}
      {children}
    </div>
  );
}

export default SettingFormItem;
