import type { ReactNode } from 'react';
import React, { useEffect, useRef } from 'react';

import { ConfigProvider } from 'antd';

import useI18n from '@core/helpers/useI18n';

import { GROUP_COLLAPSE_TOKEN } from '../../constants/designTokens';
import useKeychainShapeStore from '../../useKeychainShapeStore';

import GroupCollapse from './Controls/GroupCollapse';
import CustomShapeControls from './CustomShape/CustomShapeControls';
import DecorationControl from './DecorationControl';
import ElementControl from './Element/ElementControl';
import HoleGroup from './Hole/HoleGroup';
import styles from './OptionsPanel.module.scss';
import ShapeVariantSelector from './ShapeVariantSelector';
import SizeGroup from './SizeGroup';
import TextGroup from './Text/TextGroup';

const OptionsPanel = (): ReactNode => {
  const { keychain_generator: t } = useI18n();
  const category = useKeychainShapeStore((s) => s.category);
  const {
    customShapeElement,
    customShapeText,
    decorationPaths: decorations,
    elements = [],
    holes = [],
    texts = [],
    variants,
  } = category.options;
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    contentRef.current?.scrollTo({ behavior: 'smooth', top: 0 });
  }, [category.id]);

  return (
    <ConfigProvider
      theme={{
        components: {
          Collapse: GROUP_COLLAPSE_TOKEN,
        },
      }}
    >
      <div className={styles.panel}>
        <div className={styles.header}>{t.types[category.nameKey] ?? category.nameKey}</div>
        <div className={styles.content} ref={contentRef}>
          {variants && <ShapeVariantSelector variants={variants} />}
          {customShapeText && <CustomShapeControls elementDef={customShapeElement} textDef={customShapeText} />}
          {elements.map((option) => (
            <ElementControl key={`element-${option.id}`} optionDef={option} />
          ))}
          {decorations?.map((option) => <DecorationControl key={`decoration-${option.id}`} optionDef={option} />)}
          {texts.length > 0 && (
            <GroupCollapse key="texts" title={t.text}>
              <TextGroup optionDefs={texts} />
            </GroupCollapse>
          )}
          {holes.length > 0 && (
            <GroupCollapse key="holes" title={t.hole}>
              <HoleGroup optionDefs={holes} />
            </GroupCollapse>
          )}
          <SizeGroup />
        </div>
      </div>
    </ConfigProvider>
  );
};

OptionsPanel.displayName = 'OptionsPanel';

export default OptionsPanel;
