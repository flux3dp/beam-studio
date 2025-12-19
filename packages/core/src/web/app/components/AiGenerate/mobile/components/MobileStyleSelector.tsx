import React, { memo, useMemo, useState } from 'react';

import { CloseOutlined, LeftOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { CapsuleTabs } from 'antd-mobile';
import classNames from 'classnames';

import type { Style } from '@core/helpers/api/ai-image-config';
import useI18n from '@core/helpers/useI18n';

import { useAiConfigQuery } from '../../hooks/useAiConfigQuery';
import { useAiGenerateStore } from '../../useAiGenerateStore';
import { getCategoryForOption, getStylesForCategory } from '../../utils/categories';

import styles from './MobileStyleSelector.module.scss';

interface Props {
  onClose: () => void;
}

interface StyleCardProps {
  isSelected: boolean;
  onClick: () => void;
  style: Style;
}

const StyleCard = ({ isSelected, onClick, style }: StyleCardProps) => (
  <div className={classNames(styles['style-card'], { [styles.selected]: isSelected })} onClick={onClick}>
    <div className={styles['style-preview']}>
      <img alt={style.displayName} className={styles['style-image']} src={style.previewImage} />
    </div>
    <span className={styles['style-name']}>{style.displayName}</span>
  </div>
);

const UnmemorizedMobileStyleSelector = ({ onClose }: Props) => {
  const lang = useI18n();
  const t = lang.beambox.ai_generate;
  const { setStyle, style } = useAiGenerateStore();
  const { data: aiConfig } = useAiConfigQuery();
  const categories = useMemo(
    () => aiConfig?.categories.filter((c) => c.id !== 'customize') ?? [],
    [aiConfig?.categories],
  );
  const displayStyles = useMemo(() => aiConfig?.styles ?? [], [aiConfig?.styles]);

  // Initialize selected category based on current style
  const [selectedCategory, setSelectedCategory] = useState(() => {
    const primaryCategory = getCategoryForOption(style, displayStyles, categories);

    return primaryCategory?.id || categories[0]?.id || 'customize';
  });

  const currentCategoryStyles = useMemo(
    () => getStylesForCategory(selectedCategory, displayStyles, categories),
    [selectedCategory, displayStyles, categories],
  );

  const handleApply = (selectedStyle: string) => {
    if (selectedStyle) {
      setStyle(selectedStyle, displayStyles);
      onClose();
    }
  };

  return (
    <div className={styles['style-selector']}>
      {/* Header */}
      <div className={styles['selector-header']}>
        <Button className={styles['back-button']} icon={<LeftOutlined />} onClick={onClose} type="text" />
        <span className={styles['selector-title']}>{t.style.select}</span>
        <Button className={styles['close-button']} icon={<CloseOutlined />} onClick={onClose} type="text" />
      </div>

      {/* Category Tabs */}
      <CapsuleTabs
        activeKey={selectedCategory}
        className={styles['category-tabs']}
        onChange={(key) => setSelectedCategory(key)}
      >
        {categories.map((category) => (
          <CapsuleTabs.Tab
            key={category.id}
            title={
              <div className={styles['category-tab-content']}>
                {category.previewImage && (
                  <img alt={category.displayName} className={styles['category-icon']} src={category.previewImage} />
                )}
                <span>{category.displayName}</span>
              </div>
            }
          />
        ))}
      </CapsuleTabs>

      {/* Style Grid */}
      <div className={styles['style-grid']}>
        {currentCategoryStyles.map((styleOption) => (
          <StyleCard
            isSelected={style === styleOption.id}
            key={styleOption.id}
            onClick={() => handleApply(styleOption.id)}
            style={styleOption}
          />
        ))}
      </div>

      {/* Footer */}
      <div className={styles['selector-footer']}>
        <Button
          className={classNames(styles['custom-button'], {
            [styles.active]: style === 'customize',
          })}
          icon={<UserOutlined />}
          onClick={() => handleApply('customize')}
          size="large"
        >
          {t.style.custom_creation}
          <PlusOutlined />
        </Button>
      </div>
    </div>
  );
};

const MobileStyleSelector = memo(UnmemorizedMobileStyleSelector);

export default MobileStyleSelector;
