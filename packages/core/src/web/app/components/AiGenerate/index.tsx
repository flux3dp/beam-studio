import React, { memo, useEffect, useMemo, useRef, useState } from 'react';

import { RightOutlined } from '@ant-design/icons';
import { Button, ConfigProvider, Select, Switch } from 'antd';
import { funnel } from 'remeda';

import FluxIcons from '@core/app/icons/flux/FluxIcons';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
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
import styles from './index.module.scss';
import { AI_COST_PER_IMAGE } from './types';
import { useAiGenerateStore } from './useAiGenerateStore';
import { getDefaultStyle, getStyleConfig } from './utils/categories';
import { handleImageGeneration } from './utils/handleImageGeneration';
import { getInputFieldsForStyle } from './utils/inputFields';
import { showStyleSelectionPanel } from './utils/showStyleSelectionPanel';

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

const GENERATE_BUTTON_COOLDOWN_MS = 2000;

const UnmemorizedAiGenerate = () => {
  const lang = useI18n();
  const t = lang.beambox.ai_generate;
  const [user, setUser] = useState<IUser | null>(getCurrentUser());
  const [isGenerateDisabled, setIsGenerateDisabled] = useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const { drawerMode, setDrawerMode } = useCanvasStore();
  const {
    addImageInput,
    dimensions,
    errorMessage,
    generatedImages,
    generationStatus,
    imageInputs,
    inputFields,
    isLaserFriendly,
    maxImages,
    removeImageInput,
    setInputField,
    setState,
    setStyle,
    showHistory,
    style,
    toggleLaserFriendly,
  } = useAiGenerateStore();
  const { data: aiConfig, isError, isFetching, refetch } = useAiConfigQuery();
  const aiStyles = useMemo(() => aiConfig?.styles || [], [aiConfig?.styles]);
  const styleConfig = getStyleConfig(style, aiStyles);
  const styleId = styleConfig?.id || 'customize';
  // Store refs for values needed in throttled callback
  const paramsRef = useRef({ style: styleId, styles: aiStyles, user });
  // Auto-select default style on first open
  const hasInitializedStyle = useRef(false);

  paramsRef.current = { style: styleId, styles: aiStyles, user };

  const throttledGenerate = useRef(
    funnel(
      () => {
        setIsGenerateDisabled(true);
        handleImageGeneration(paramsRef.current);
        requestAnimationFrame(() => {
          contentRef.current?.scrollTo({ behavior: 'smooth', top: 1000 });
        });
        setTimeout(() => setIsGenerateDisabled(false), GENERATE_BUTTON_COOLDOWN_MS);
      },
      { minGapMs: GENERATE_BUTTON_COOLDOWN_MS, triggerAt: 'start' },
    ),
  );

  const onGenerate = () => throttledGenerate.current.call();

  useEffect(() => {
    fluxIDEvents.on('update-user', setUser);

    return () => {
      fluxIDEvents.off('update-user', setUser);
    };
  }, []);

  useEffect(() => {
    if (drawerMode !== 'ai-generate') return;

    const exitScope = shortcuts.enterScope();
    const unregister = shortcuts.on(['Escape'], () => setDrawerMode('none'), { isBlocking: true });

    return () => {
      unregister();
      exitScope();
    };
  }, [drawerMode, setDrawerMode]);

  useEffect(() => {
    if (hasInitializedStyle.current || aiStyles.length === 0) return;

    const categories = aiConfig?.categories || [];
    const firstStyle = getDefaultStyle(aiStyles, categories);

    if (firstStyle && firstStyle.id !== 'customize') {
      setStyle(firstStyle.id, aiStyles);
      hasInitializedStyle.current = true;
    }
  }, [aiConfig, aiStyles, setStyle]);

  const handleStyleClick = () => showStyleSelectionPanel((s) => setStyle(s, aiStyles), style);

  if (isFetching) return <LoadingView contentRef={contentRef} />;

  if (isError) return <ErrorView contentRef={contentRef} onRetry={refetch} />;

  return (
    <ConfigProvider theme={{ token: { borderRadius: 6, borderRadiusLG: 6 } }}>
      <div className={styles['ai-generate-container']}>
        <Header contentRef={contentRef} />
        <div className={styles.content} ref={contentRef}>
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
                        onAddImage={addImageInput}
                        onChange={(value) => setInputField(field.key, value)}
                        onKeyDown={handleTextAreaKeyDown}
                        onRemoveImage={removeImageInput}
                        value={inputFields[field.key] || ''}
                      />
                    ) : (
                      <InputField
                        field={field}
                        onChange={(value) => setInputField(field.key, value)}
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
                  onChange={(val) => setState({ maxImages: val })}
                  options={[1, 2, 3, 4].map((n) => ({ label: String(n), value: n }))}
                  value={maxImages}
                />
              </div>

              <div className={styles.section}>
                <div className={styles['toggle']}>
                  <span>{t.form.laser_friendly}</span>
                  <Switch checked={isLaserFriendly} onChange={toggleLaserFriendly} />
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
            <Button
              block
              className={styles['generate-button']}
              disabled={isGenerateDisabled}
              onClick={onGenerate}
              size="large"
              type="primary"
            >
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
