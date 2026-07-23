import React from 'react';

import Content from '@core/app/components/beambox/RightPanel/common/Content';
import { ObjectPanelItem } from '@core/app/components/beambox/RightPanel/common/ObjectPanelItem';
import VariableTextBlock from '@core/app/components/beambox/RightPanel/OptionsBlocks/VariableOptions/VariableTextBlock';
import ObjectPanelIcons from '@core/app/icons/object-panel/ObjectPanelIcons';
import { useIsTabletOrMobile } from '@core/app/stores/layoutStore';
import useI18n from '@core/helpers/useI18n';

interface Props {
  elems: SVGElement[];
  id: string;
}

const VariableUseOptions = ({ elems, id }: Props) => {
  const isTablet = useIsTabletOrMobile();
  const t = useI18n().beambox.right_panel.object_panel.option_panel;

  return isTablet ? (
    <ObjectPanelItem
      // Note: for now, this component is only used for variable text in qrcode and barcode
      icon={<ObjectPanelIcons.QRCode />}
      id="variable-use-option"
      renderContent={() => (
        <Content>
          <VariableTextBlock elems={elems} id={id} />
        </Content>
      )}
      title={t.variable_text}
    />
  ) : (
    <VariableTextBlock elems={elems} id={id} />
  );
};

export default VariableUseOptions;
