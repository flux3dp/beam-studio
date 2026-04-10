import type { ReactNode } from 'react';
import React from 'react';

import classNames from 'classnames';

import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import type { KeyChainCategory } from '../../types';

import CustomShapeGroup from './CustomShapeGroup';
import ElementControl from './element/ElementControl';
import HoleGroup from './HoleGroup';
import styles from './OptionsPanel.module.scss';
import SizeGroup from './SizeGroup';
import TextGroup from './text/TextGroup';

interface OptionsPanelProps {
  category: KeyChainCategory;
}

const OptionsPanel = ({ category }: OptionsPanelProps): ReactNode => {
  const { keychain_generator: t } = useI18n();
  const isMobile = useIsMobile();
  const { customShape, elements = [], holes = [], texts = [] } = category.options;

  return (
    <div className={classNames(styles.panel, { [styles.mobile]: isMobile })}>
      <div className={styles.header}>{t.types[category.nameKey] ?? category.nameKey}</div>
      <div className={styles.content}>
        <SizeGroup />
        {customShape && <CustomShapeGroup optionDef={customShape} />}
        {elements.map((option) => (
          <ElementControl key={`element-${option.id}`} optionDef={option} />
        ))}
        {texts.map((option) => (
          <TextGroup key={`text-${option.id}`} optionDef={option} />
        ))}
        {holes.map((option) => (
          <HoleGroup key={`hole-${option.id}`} optionDef={option} />
        ))}
      </div>
    </div>
  );
};

OptionsPanel.displayName = 'OptionsPanel';

export default OptionsPanel;
