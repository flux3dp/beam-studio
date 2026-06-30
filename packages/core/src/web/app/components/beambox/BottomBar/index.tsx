import React from 'react';

import TemplateBottomBar from '@core/app/components/beambox/BottomBar/TemplateBottomBar';
import ObjectPanel from '@core/app/components/beambox/RightPanel/ObjectPanel';
import { useSelectedElementStore } from '@core/app/stores/element/selectedElementStore';
import { templateModes, useWithinInteractionModes } from '@core/app/stores/interactionModeStore';

const BottomBar = () => {
  const selectedElement = useSelectedElementStore((state) => state.selectedElement);
  const isWithinTemplateModes = useWithinInteractionModes(templateModes);

  return isWithinTemplateModes ? <TemplateBottomBar /> : <ObjectPanel hide={!selectedElement} />;
};

export default BottomBar;
