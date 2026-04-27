import type { ReactNode } from 'react';
import React, { useEffect, useRef } from 'react';

import { ConfigProvider } from 'antd';
import classNames from 'classnames';

import { useIsMobile } from '@core/app/stores/screenStore';
import useI18n from '@core/helpers/useI18n';

import type { KeyChainCategory } from '../../types';

import GroupCollapse from './Controls/GroupCollapse';
import CustomShapeGroup from './CustomShapeGroup';
import DecorationControl from './DecorationControl';
import ElementControl from './Element/ElementControl';
import HoleControl from './HoleControl';
import styles from './OptionsPanel.module.scss';
import SizeGroup from './SizeGroup';
import TextControl from './Text/TextControl';

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
          {texts.length > 0 && (
            <GroupCollapse key="texts" title={t.text}>
              {texts.map((option) => (
                <TextControl key={`text-${option.id}`} optionDef={option} />
              ))}
            </GroupCollapse>
          )}
          {holes.length > 0 && (
            <GroupCollapse key="holes" title={t.hole}>
              {holes.map((option) => (
                <HoleControl key={`hole-${option.id}`} optionDef={option} />
              ))}
            </GroupCollapse>
          )}
        </div>
      </div>
    </ConfigProvider>
  );
};

OptionsPanel.displayName = 'OptionsPanel';

export default OptionsPanel;
