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

interface StyleCardProps {
  isSelected: boolean;
  onClick: () => void;
  style: Style;
}

const StyleCard = ({ isSelected, onClick, style }: StyleCardProps) => (
  <div className={classNames(styles.card, { [styles.selected]: isSelected })} onClick={onClick}>
    <div className={styles.cardPreview}>
      <img alt={style.displayName} className={styles.cardImage} src={style.previewImage} />
    </div>
    <span className={styles.cardName}>{style.displayName}</span>
  </div>
);

interface Props {
  onClose: () => void;
}

const MobileStyleSelector = memo(({ onClose }: Props) => {
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
    <div className={styles.container}>
      <div className={styles.header}>
        <Button className={styles.backButton} icon={<LeftOutlined />} onClick={onClose} type="text" />
        <span className={styles.selectorTitle}>{t.style.select}</span>
        <Button className={styles.closeButton} icon={<CloseOutlined />} onClick={onClose} type="text" />
      </div>

      <CapsuleTabs
        activeKey={selectedCategory}
        className={styles.categoryTabs}
        onChange={(key) => setSelectedCategory(key)}
      >
        {categories.map((category) => (
          <CapsuleTabs.Tab
            key={category.id}
            title={
              <div className={styles.categoryTabContent}>
                {category.previewImage && (
                  <img alt={category.displayName} className={styles.categoryIcon} src={category.previewImage} />
                )}
                <span>{category.displayName}</span>
              </div>
            }
          />
        ))}
      </CapsuleTabs>

      <div className={styles.gridWrapper}>
        <div className={styles.grid}>
          {currentCategoryStyles.map((styleOption) => (
            <StyleCard
              isSelected={style === styleOption.id}
              key={styleOption.id}
              onClick={() => handleApply(styleOption.id)}
              style={styleOption}
            />
          ))}
        </div>
      </div>

      <div className={styles.footer}>
        <Button
          className={classNames(styles.customButton, { [styles.active]: style === 'customize' })}
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
});

export default MobileStyleSelector;
