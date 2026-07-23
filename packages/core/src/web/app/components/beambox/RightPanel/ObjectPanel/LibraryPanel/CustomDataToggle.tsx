import { useCallback, useState } from 'react';

import Row from '@core/app/components/beambox/RightPanel/common/Row';
import Switch from '@core/app/components/beambox/RightPanel/common/Switch';
import { getCustomerUploadAllowed, setCustomerUploadAllowed } from '@core/helpers/contentLibrary/manager';
import useI18n from '@core/helpers/useI18n';

interface Props {
  elem: Element;
}

const CustomDataToggle = ({ elem }: Props) => {
  const { library } = useI18n().beambox.right_panel.object_panel;
  const [checked, setChecked] = useState(getCustomerUploadAllowed(elem));
  const onToggle = useCallback(() => {
    setCustomerUploadAllowed(elem, !checked);
    setChecked(!checked);
  }, [elem, checked]);

  return (
    <Row>
      <span>{library.allow_user_upload}</span>
      <Switch checked={checked} onClick={onToggle} style={{ marginLeft: 'auto' }} />
    </Row>
  );
};

export default CustomDataToggle;
