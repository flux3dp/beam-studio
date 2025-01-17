import React from 'react';
import { SelectProps, Select as AntdSelect } from 'antd';

import isWeb from 'helpers/is-web';

// TODO: replace native selects (including widgets/Select.tsx) and rename to Select.tsx
const Select = (props: SelectProps): JSX.Element => (
  // eslint-disable-next-line react/jsx-props-no-spreading
  <AntdSelect {...props} dropdownAlign={!isWeb() && { overflow: { adjustY: 0 } }} />
);
Select.Option = AntdSelect.Option;
Select.OptGroup = AntdSelect.OptGroup;

export default Select;
