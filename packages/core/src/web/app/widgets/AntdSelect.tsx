import React from 'react';

import type { SelectProps } from 'antd';
import { Select as AntdSelect } from 'antd';

import isWeb from '@core/helpers/is-web';

// TODO: replace native selects (including widgets/Select.tsx) and rename to Select.tsx
const Select = (props: SelectProps): React.JSX.Element => (
  <AntdSelect {...props} dropdownAlign={!isWeb() && { overflow: { adjustY: 0 } }} />
);

Select.Option = AntdSelect.Option;
Select.OptGroup = AntdSelect.OptGroup;

export default Select;
