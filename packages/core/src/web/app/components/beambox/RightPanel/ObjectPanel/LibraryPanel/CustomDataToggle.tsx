import { useCallback, useState } from 'react';

import { Switch } from 'antd';

import Row from '@core/app/components/beambox/RightPanel/common/Row';
import { getCustomerUploadAllowed, setCustomerUploadAllowed } from '@core/helpers/contentLibrary/manager';
import { mockT } from '@core/helpers/is-dev';

interface Props {
  elem: Element;
}

const CustomDataToggle = ({ elem }: Props) => {
  const [checked, setChecked] = useState(getCustomerUploadAllowed(elem));
  const onToggle = useCallback(() => {
    setCustomerUploadAllowed(elem, !checked);
    setChecked(!checked);
  }, [elem, checked]);

  return (
    <Row>
      <span>{mockT('允許使用者上傳')}</span>
      <Switch checked={checked} onClick={onToggle} style={{ marginLeft: 'auto' }} />
    </Row>
  );
};

export default CustomDataToggle;
