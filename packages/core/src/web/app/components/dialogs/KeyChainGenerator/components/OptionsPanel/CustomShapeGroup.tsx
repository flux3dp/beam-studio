import type { ReactNode } from 'react';
import React, { memo } from 'react';

import type { CustomShapeElementOptionDef, CustomShapeTextOptionDef } from '../../types';

import CustomShapeElementGroup from './CustomShapeElementGroup';
import CustomShapeTextGroup from './CustomShapeTextGroup';
import OutlineOffsetControl from './OutlineOffsetControl';

interface CustomShapeGroupProps {
  elementDef?: CustomShapeElementOptionDef;
  textDef: CustomShapeTextOptionDef;
}

const CustomShapeGroup = ({ elementDef, textDef }: CustomShapeGroupProps): ReactNode => (
  <>
    {elementDef && <CustomShapeElementGroup elementDef={elementDef} />}
    <CustomShapeTextGroup textDef={textDef} />
    <OutlineOffsetControl />
  </>
);

CustomShapeGroup.displayName = 'CustomShapeGroup';

export default memo(CustomShapeGroup);
