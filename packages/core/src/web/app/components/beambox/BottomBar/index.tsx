import React, { useEffect, useState } from 'react';

import TemplateBottomBar from '@core/app/components/beambox/BottomBar/TemplateBottomBar';
import ObjectPanel from '@core/app/components/beambox/RightPanel/ObjectPanel';
import { useSelectedElementStore } from '@core/app/stores/element/selectedElementStore';
import { templateModes, useWithinInteractionModes } from '@core/app/stores/interactionModeStore';
import { templateEventEmitter } from '@core/helpers/layer/templateTargetLayer';

const BottomBar = () => {
  const selectedElement = useSelectedElementStore((state) => state.selectedElement);
  const isWithinTemplateModes = useWithinInteractionModes(templateModes);
  const [templateKey, setTemplateKey] = useState(0);

  useEffect(() => {
    if (!isWithinTemplateModes) return;

    const onTemplateUpdate = () => setTemplateKey((prevKey) => prevKey + 1);

    templateEventEmitter.on('TEMPLATE_FILE_CHANGED', onTemplateUpdate);

    return () => {
      templateEventEmitter.off('TEMPLATE_FILE_CHANGED', onTemplateUpdate);
    };
  }, [isWithinTemplateModes]);

  return isWithinTemplateModes ? <TemplateBottomBar key={templateKey} /> : <ObjectPanel hide={!selectedElement} />;
};

export default BottomBar;
