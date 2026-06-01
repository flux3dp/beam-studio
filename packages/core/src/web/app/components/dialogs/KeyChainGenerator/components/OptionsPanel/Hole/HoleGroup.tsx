import type { ReactNode } from 'react';
import React from 'react';

import useI18n from '@core/helpers/useI18n';

import type { HoleOptionDef } from '../../../types';
import AccordionGroup from '../Controls/AccordionGroup';

import HoleControl from './HoleControl';

interface HoleGroupProps {
  optionDefs: HoleOptionDef[];
}

const HoleGroup = ({ optionDefs }: HoleGroupProps): ReactNode => {
  const { keychain_generator: t } = useI18n();

  return (
    <AccordionGroup
      labelPrefix={t.hole}
      optionDefs={optionDefs}
      renderControl={(def) => <HoleControl optionDef={def} />}
      stateKey="holes"
    />
  );
};

HoleGroup.displayName = 'HoleGroup';

export default HoleGroup;
