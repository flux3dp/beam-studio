import type { ReactNode } from 'react';
import React, { useEffect, useRef } from 'react';

import { ConfigProvider } from 'antd';
import classNames from 'classnames';

import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import type { KeyChainCategory } from '../../types';

import CustomShapeGroup from './CustomShapeGroup';
import DecorationControl from './DecorationControl';
import ElementControl from './Element/ElementControl';
import HoleGroup from './HoleGroup';
import styles from './OptionsPanel.module.scss';
import SizeGroup from './SizeGroup';
import TextGroup from './Text/TextGroup';

interface OptionsPanelProps {
  category: KeyChainCategory;
}

const OptionsPanel = ({ category }: OptionsPanelProps): ReactNode => {
  const { keychain_generator: t } = useI18n();
  const isMobile = useIsMobile();
  const { customShape, decorationPaths: decorations, elements = [], holes = [], texts = [] } = category.options;
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    contentRef.current?.scrollTo({ behavior: 'smooth', top: 0 });
  }, [category.id]);

  return (
    <ConfigProvider
      theme={{
        components: {
          Collapse: {
            contentPadding: '0',
            headerPadding: '0 0 12px',
          },
        },
      }}
    >
      <div className={classNames(styles.panel, { [styles.mobile]: isMobile })}>
        <div className={styles.header}>{t.types[category.nameKey] ?? category.nameKey}</div>
        <div className={styles.content} ref={contentRef}>
          <SizeGroup />
          {customShape && <CustomShapeGroup optionDef={customShape} />}
          {elements.map((option) => (
            <ElementControl key={`element-${option.id}`} optionDef={option} />
          ))}
          {decorations?.map((option) => <DecorationControl key={`decoration-${option.id}`} optionDef={option} />)}
          {texts.map((option) => (
            <TextGroup key={`text-${option.id}`} optionDef={option} />
          ))}
          {holes.map((option) => (
            <HoleGroup key={`hole-${option.id}`} optionDef={option} />
          ))}
        </div>
      </div>
    </ConfigProvider>
  );
};

OptionsPanel.displayName = 'OptionsPanel';

export default OptionsPanel;
