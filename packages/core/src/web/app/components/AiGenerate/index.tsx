import React, { memo, useEffect, useRef } from 'react';

import { RightOutlined } from '@ant-design/icons';
import { Button, ConfigProvider, Select, Switch } from 'antd';

import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import { useFocusScope } from '@core/helpers/useFocusScope';
import useI18n from '@core/helpers/useI18n';

import DimensionSelector from './components/DimensionSelector';
import ErrorView from './components/ErrorView';
import Header from './components/Header';
import ImageHistory from './components/ImageHistory';
import ImageResults from './components/ImageResults';
import InputFieldsSection from './components/InputFieldsSection';
import LoadingView from './components/LoadingView';
import StickyFooter from './components/StickyFooter';
import { useAiConfigQuery } from './hooks/useAiConfigQuery';
import { useAiGenerateEffects } from './hooks/useAiGenerateEffects';
import styles from './index.module.scss';
import { useAiGenerateStore } from './useAiGenerateStore';
import { getStyleConfig } from './utils/categories';
import { showStyleSelectionPanel } from './utils/showStyleSelectionPanel';

const AiGenerate = memo(() => {
  const lang = useI18n();
  const t = lang.beambox.ai_generate;
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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
    styleId,
    toggleLaserFriendly,
    user,
  } = useAiGenerateStore();
  const {
    data: { styles: aiStyles },
    isError,
    isFetching,
    refetch,
  } = useAiConfigQuery();
  const { isGenerateDisabled, onGenerate, showFooter } = useAiGenerateEffects({ scrollTarget: contentRef.current });
  const style = getStyleConfig(styleId, aiStyles);

  useFocusScope(containerRef);

  // Escape key to close (desktop-specific)
  useEffect(() => {
    if (drawerMode !== 'ai-generate') return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setDrawerMode('none');
      }
    };

    window.addEventListener('keydown', handleEscape, { capture: true });

    return () => window.removeEventListener('keydown', handleEscape, { capture: true });
  }, [drawerMode, setDrawerMode]);

  const handleStyleClick = () => showStyleSelectionPanel((s) => setStyle(s, aiStyles), styleId);

  // Render content based on state
  const renderContent = () => {
    if (isFetching) return <LoadingView />;

    if (isError) return <ErrorView onRetry={refetch} />;

    if (showHistory) return <ImageHistory />;

    return (
      <>
        <div className={styles.section}>
          <h3 className={styles['section-title']}>{t.style.choose}</h3>
          <Button block className={styles['style-selection-button']} onClick={handleStyleClick} size="large">
            {style.previewImage && <img alt={style.displayName} className={styles.img} src={style.previewImage} />}
            <div className={styles['button-content']}>
              <span className={styles['button-label']}>{style?.displayName || t.style.select}</span>
              <RightOutlined />
            </div>
          </Button>
        </div>

        <InputFieldsSection
          aiStyles={aiStyles}
          imageInputs={imageInputs}
          inputFields={inputFields}
          onAddImage={addImageInput}
          onFieldChange={setInputField}
          onRemoveImage={removeImageInput}
          style={style}
          styleId={styleId}
        />

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
            <h3 className={styles['section-title']} style={{ margin: 0 }}>
              {t.form.laser_friendly}
            </h3>
            <Switch checked={isLaserFriendly} onChange={toggleLaserFriendly} />
          </div>
        </div>

        <ImageResults
          errorMessage={errorMessage}
          generatedImages={generatedImages}
          generationStatus={generationStatus}
        />
      </>
    );
  };

  return (
    <ConfigProvider theme={{ token: { borderRadius: 6, borderRadiusLG: 6 } }}>
      <div className={styles['ai-generate-container']} ref={containerRef}>
        <Header />
        <div className={styles.content} ref={contentRef}>
          {renderContent()}
        </div>
        {showFooter && (
          <StickyFooter
            buyLink={lang.beambox.popup.ai_credit.buy_link}
            isDisabled={isGenerateDisabled}
            maxImages={maxImages}
            onGenerate={onGenerate}
            user={user}
          />
        )}
      </div>
    </ConfigProvider>
  );
});

export default AiGenerate;
