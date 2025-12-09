import React, { memo, useEffect, useState } from 'react';

import { RightOutlined } from '@ant-design/icons';
import { Button, ConfigProvider, Select, Switch } from 'antd';
import classNames from 'classnames';

import dialogCaller from '@core/app/actions/dialog-caller';
import FluxIcons from '@core/app/icons/flux/FluxIcons';
import { fluxIDEvents, getCurrentUser } from '@core/helpers/api/flux-id';
import shortcuts from '@core/helpers/shortcuts';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';
import type { IUser } from '@core/interfaces/IUser';

import DimensionSelector from './components/DimensionSelector';
import ErrorView from './components/ErrorView';
import Header from './components/Header';
import ImageHistory from './components/ImageHistory';
import ImageResults from './components/ImageResults';
import InputField from './components/InputField';
import InputWithUpload from './components/InputField.upload';
import LoadingView from './components/LoadingView';
import { useAiConfigQuery } from './hooks/useAiConfigQuery';
import { useImageGeneration } from './hooks/useImageGeneration';
import styles from './index.module.scss';
import { AI_COST_PER_IMAGE } from './types';
import { useAiGenerateStore } from './useAiGenerateStore';
import { getStyleConfig } from './utils/categories';
import { getInputFieldsForStyle } from './utils/inputFields';

const handleTextAreaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
  e.stopPropagation();

  const isSelectAll = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a';

  if (isSelectAll) {
    e.preventDefault();
    e.currentTarget.select();
  }

  if (e.key === 'Escape') {
    e.preventDefault();
    e.currentTarget.blur();
  }
};

const UnmemorizedAiGenerate = () => {
  const lang = useI18n();
  const t = lang.beambox.ai_generate;
  const [user, setUser] = useState<IUser | null>(getCurrentUser());
  const store = useAiGenerateStore();
  const {
    dimensions,
    errorMessage,
    generatedImages,
    generationStatus,
    imageInputs,
    inputFields,
    isAiGenerateShown,
    isLaserFriendly,
    maxImages,
    showHistory,
    style,
  } = store;

  // 1. Data Fetching
  const { data: aiConfig, isError, isLoading, refetch } = useAiConfigQuery();
  const aiStyles = aiConfig?.styles || [];

  // 2. Logic & Configuration
  const styleConfig = getStyleConfig(style, aiStyles);
  const styleId = styleConfig?.id || 'customize';
  const { handleGenerate } = useImageGeneration({
    dimensions,
    maxImages,
    style: styleId,
    styles: aiStyles,
    user,
  });

  useEffect(() => {
    fluxIDEvents.on('update-user', setUser);

    return () => {
      fluxIDEvents.off('update-user', setUser);
    };
  }, []);

  useEffect(() => {
    if (!isAiGenerateShown) return;

    const exitScope = shortcuts.enterScope();
    const unregister = shortcuts.on(['Escape'], () => store.setState({ isAiGenerateShown: false }), {
      isBlocking: true,
    });

    return () => {
      unregister();
      exitScope();
    };
  }, [isAiGenerateShown, store]);

  // 4. Handlers
  const handleStyleClick = () => dialogCaller.showStyleSelectionPanel((s) => store.setStyle(s, aiStyles), style);

  // 5. Render
  if (isLoading) return <LoadingView onClose={() => store.setState({ isAiGenerateShown: false })} />;

  if (isError) return <ErrorView onClose={() => store.setState({ isAiGenerateShown: false })} onRetry={refetch} />;

  return (
    <ConfigProvider theme={{ token: { borderRadius: 6, borderRadiusLG: 6 } }}>
      <div className={classNames(styles['ai-generate-container'])}>
        <Header
          onClose={() => store.setState({ isAiGenerateShown: false })}
          onHistory={store.toggleHistory}
          onRefresh={store.resetForm}
          showHistory={showHistory}
        />
        <div className={styles.content}>
          {showHistory ? (
            <ImageHistory />
          ) : (
            <>
              <div className={styles.section}>
                <h3 className={styles['section-title']}>{t.style.choose}</h3>
                <Button block className={styles['style-selection-button']} onClick={handleStyleClick} size="large">
                  {styleConfig.previewImage && (
                    <img alt={styleConfig.displayName} className={styles.img} src={styleConfig.previewImage} />
                  )}
                  <div className={styles['button-content']}>
                    <span className={styles['button-label']}>{styleConfig?.displayName || t.style.select}</span>
                    <RightOutlined />
                  </div>
                </Button>
              </div>

              {getInputFieldsForStyle(styleId, aiStyles).map((field) => {
                // Determine if this specific field needs upload capabilities
                const isDescriptionWithUpload = field.key === 'description' && styleConfig?.modes?.includes('edit');

                return (
                  <div className={styles.section} key={field.key}>
                    <h3 className={styles['section-title']}>
                      {field.label} {field.required && <span className={styles.required}>*</span>}
                    </h3>

                    {isDescriptionWithUpload ? (
                      <InputWithUpload
                        field={field}
                        imageInputs={imageInputs}
                        onAddImage={store.addImageInput}
                        onChange={(value) => store.setInputField(field.key, value)}
                        onKeyDown={handleTextAreaKeyDown}
                        onRemoveImage={store.removeImageInput}
                        value={inputFields[field.key] || ''}
                      />
                    ) : (
                      <InputField
                        field={field}
                        onChange={(value) => store.setInputField(field.key, value)}
                        onKeyDown={handleTextAreaKeyDown}
                        rows={field.key === 'description' ? 5 : 3}
                        value={inputFields[field.key] || ''}
                      />
                    )}
                  </div>
                );
              })}

              <DimensionSelector dimensions={dimensions} />

              <div className={styles.section}>
                <h3 className={styles['section-title']}>{t.form.count}</h3>
                <Select
                  className={styles['count-select']}
                  onChange={(val) => store.setState({ maxImages: val })}
                  options={[1, 2, 3, 4].map((n) => ({ label: String(n), value: n }))}
                  value={maxImages}
                />
              </div>

              <div className={styles.section}>
                <div className={styles['toggle']}>
                  <span>{t.form.laser_friendly}</span>
                  <Switch checked={isLaserFriendly} onChange={store.toggleLaserFriendly} />
                </div>
              </div>

              <ImageResults
                errorMessage={errorMessage}
                generatedImages={generatedImages}
                generationStatus={generationStatus}
              />
            </>
          )}
        </div>
        {!showHistory && (
          <div className={styles['button-section']}>
            <Button block className={styles['generate-button']} onClick={handleGenerate} size="large" type="primary">
              {t.form.generate}
            </Button>
            <div className={styles['credits-info']}>
              <span className={styles['credits-required']}>
                {t.form.credit_required} {(AI_COST_PER_IMAGE * maxImages).toFixed(2)}
              </span>
              <div
                className={styles['credits-balance']}
                onClick={() => browser.open(lang.beambox.popup.ai_credit.buy_link)}
              >
                <FluxIcons.FluxCredit />
                <span className={styles['ai-credit']}>{user?.info?.credit || 0}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </ConfigProvider>
  );
};

export default memo(UnmemorizedAiGenerate);
