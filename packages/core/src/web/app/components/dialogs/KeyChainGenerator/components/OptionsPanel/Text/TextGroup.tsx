import type { ReactNode } from 'react';
import React from 'react';

import useI18n from '@core/helpers/useI18n';

import type { TextOptionDef } from '../../../types';
import AccordionGroup from '../Controls/AccordionGroup';

import TextControl from './TextControl';

interface TextGroupProps {
  optionDefs: TextOptionDef[];
}

const TextGroup = ({ optionDefs }: TextGroupProps): ReactNode => {
  const { keychain_generator: t } = useI18n();

  return (
    <AccordionGroup
      labelPrefix={t.text}
      optionDefs={optionDefs}
      renderControl={(def) => <TextControl optionDef={def} />}
      stateKey="texts"
    />
  );
};

TextGroup.displayName = 'TextGroup';

export default TextGroup;
