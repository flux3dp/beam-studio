import type { ReactNode } from 'react';
import React, { memo } from 'react';

import type { CustomShapeElementOptionDef, CustomShapeTextOptionDef } from '../../../types';

import CustomShapeElementGroup from './CustomShapeElementGroup';
import CustomShapeTextGroup from './CustomShapeTextGroup';
import OutlineOffsetControl from './OutlineOffsetControl';

interface CustomShapeControlsProps {
  elementDef?: CustomShapeElementOptionDef;
  textDef: CustomShapeTextOptionDef;
}

const CustomShapeControls = ({ elementDef, textDef }: CustomShapeControlsProps): ReactNode => (
  <>
    {elementDef && <CustomShapeElementGroup elementDef={elementDef} />}
    <CustomShapeTextGroup textDef={textDef} />
    <OutlineOffsetControl />
  </>
);

CustomShapeControls.displayName = 'CustomShapeControls';

export default memo(CustomShapeControls);
