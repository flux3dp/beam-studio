import React from 'react';

import type { SelectProps } from 'antd';
import { Select as AntdSelect } from 'antd';

import isWeb from '@core/helpers/is-web';

// TODO: replace native selects (including widgets/Select.tsx) and rename to Select.tsx
const Select = function (props: SelectProps): React.JSX.Element {
  return <AntdSelect {...props} dropdownAlign={(!isWeb() && { overflow: { adjustY: 0 } }) || undefined} />;
};

Select.Option = AntdSelect.Option;
Select.OptGroup = AntdSelect.OptGroup;

export default Select;
