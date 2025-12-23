import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ReloadOutlined, RightOutlined } from '@ant-design/icons';
import { Button, ConfigProvider, Switch } from 'antd';
import { Popup, Tabs } from 'antd-mobile';
import classNames from 'classnames';
import { funnel } from 'remeda';

import layoutConstants from '@core/app/constants/layout-constants';
import FluxIcons from '@core/app/icons/flux/FluxIcons';
import FloatingPanel, { type FloatingPanelHandle } from '@core/app/widgets/FloatingPanel';
import { fluxIDEvents, getCurrentUser } from '@core/helpers/api/flux-id';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';
import type { IUser } from '@core/interfaces/IUser';

import ErrorView from '../components/ErrorView';
import ImageHistory from '../components/ImageHistory';
import ImageResults from '../components/ImageResults';
import InputField from '../components/InputField';
import InputWithUpload from '../components/InputField.upload';
import LoadingView from '../components/LoadingView';
import { useAiConfigQuery } from '../hooks/useAiConfigQuery';
import { AI_COST_PER_IMAGE, GENERATE_BUTTON_COOLDOWN_MS, handleTextAreaKeyDown } from '../types';
import { useAiGenerateStore } from '../useAiGenerateStore';
import { getDefaultStyle, getStyleConfig } from '../utils/categories';
import { handleImageGeneration } from '../utils/handleImageGeneration';
import { getInputFieldsForStyle } from '../utils/inputFields';

import MobileStyleSelector from './components/MobileStyleSelector';
import UniformSelector from './components/UniformSelector';
import {
  getCountOptions,
  getRatioOptions,
  getSizeOptions,
  handleCountSelect,
  handleRatioSelect,
  handleSizeSelect,
} from './components/UniformSelector.config';
import styles from './MobileAiGenerate.module.scss';

const Header = ({ onTabChange, showHistory, t }: any) => (
  <div className={styles.header}>
    <Tabs activeKey={showHistory ? 'history' : 'editor'} className={styles.tabs} onChange={onTabChange}>
      <Tabs.Tab key="editor" title={t.form.editor} />
      <Tabs.Tab key="history" title={t.header.history_tooltip} />
    </Tabs>
  </div>
);

const StyleSection = ({ onClick, onReset, styleConfig, t }: any) => (
  <div className={styles.section}>
    <div className={styles['section-header']}>
      <h3 className={styles['section-title']}>{t.style.choose}</h3>
      <Button className={styles['reset-button']} icon={<ReloadOutlined />} onClick={onReset} type="text" />
    </div>
    <Button block className={styles['style-selection-button']} onClick={onClick} size="large">
      {styleConfig.previewImage && (
        <img alt={styleConfig.displayName} className={styles['style-img']} src={styleConfig.previewImage} />
      )}
      <div className={styles['button-content']}>
        <span className={styles['button-label']}>{styleConfig?.displayName || t.style.select}</span>
        <RightOutlined />
      </div>
    </Button>
  </div>
);

const RatioSection = ({ dimensions, onClick, t }: any) => (
  <div className={styles['section-half']}>
    <h3 className={styles['section-title']}>{t.dimensions.ratio}</h3>
    <Button block className={styles['section-button']} onClick={onClick} size="large">
      <div className={styles['ratio-preview']}>
        <div className={styles[`ratio-${dimensions.aspectRatio.replace(':', '-')}`]} />
        <span>{dimensions.aspectRatio}</span>
      </div>
      <RightOutlined />
    </Button>
  </div>
);

const SizeSection = ({ dimensions, onClick, t }: any) => (
  <div className={styles['section-half']}>
    <h3 className={styles['section-title']}>{t.dimensions.resolution}</h3>
    <Button block className={styles['section-button']} onClick={onClick} size="large">
      <span className={styles['label']}>{dimensions.size}</span>
      <RightOutlined />
    </Button>
  </div>
);

const CountSection = ({ maxImages, onClick, t }: any) => (
  <div className={styles.section}>
    <h3 className={styles['section-title']}>{t.form.count}</h3>
    <Button block className={styles['section-button']} onClick={onClick} size="large">
      <span className={styles['label']}>{maxImages}</span>
      <RightOutlined />
    </Button>
  </div>
);

const ToggleSection = ({ checked, label, onChange }: any) => (
  <div className={styles.section}>
    <div className={styles.toggle}>
      <span>{label}</span>
      <Switch checked={checked} onChange={onChange} />
    </div>
  </div>
);

const Footer = ({ buyLink, isDisabled, maxImages, onGenerate, t, user }: any) => (
  <div className={styles.footer}>
    <Button
      block
      className={styles['generate-button']}
      disabled={isDisabled}
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
      <div className={styles['credits-balance']} onClick={() => browser.open(buyLink)}>
        <FluxIcons.FluxCredit />
        <span className={styles['ai-credit']}>{user?.info?.credit || 0}</span>
      </div>
    </div>
  </div>
);

interface Props {
  onClose: () => void;
}

const MobileAiGenerate = memo(({ onClose }: Props) => {
  const lang = useI18n();
  const t = lang.beambox.ai_generate;
  const [user, setUser] = useState<IUser | null>(getCurrentUser());
  const [isGenerateDisabled, setIsGenerateDisabled] = useState(false);
  const [showStyleSelector, setShowStyleSelector] = useState(false);
  const [showRatioSelector, setShowRatioSelector] = useState(false);
  const [showSizeSelector, setShowSizeSelector] = useState(false);
  const [showCountSelector, setShowCountSelector] = useState(false);
  const anchors = [0, window.innerHeight - layoutConstants.menuberHeight];
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
    resetForm,
    scrollTarget,
    scrollTrigger,
    setInputField,
    setStyle,
    showHistory,
    style,
    toggleHistory,
    toggleLaserFriendly,
    triggerScroll,
  } = useAiGenerateStore();
  const { data: aiConfig, isError, isFetching, refetch } = useAiConfigQuery();
  const aiStyles = useMemo(() => aiConfig?.styles || [], [aiConfig?.styles]);
  const styleConfig = getStyleConfig(style, aiStyles);
  const styleId = styleConfig?.id || 'customize';
  const [panelHandle, setPanelHandle] = useState<FloatingPanelHandle | null>(null);
  const hasInitializedStyle = useRef(false);

  // Handle scroll triggers from store
  useEffect(() => {
    if (scrollTrigger === 0) return;

    requestAnimationFrame(() => {
      const top = scrollTarget === 'top' ? 0 : 1000;

      panelHandle?.scrollTo({ behavior: 'smooth', top });
    });
  }, [scrollTrigger, scrollTarget, panelHandle]);

  const throttledGenerate = useMemo(
    () =>
      funnel(
        () => {
          setIsGenerateDisabled(true);
          handleImageGeneration({ style: styleId, styles: aiStyles, user });
          triggerScroll('bottom');
          setTimeout(() => setIsGenerateDisabled(false), GENERATE_BUTTON_COOLDOWN_MS);
        },
        { minGapMs: GENERATE_BUTTON_COOLDOWN_MS, triggerAt: 'start' },
      ),
    [styleId, aiStyles, user, triggerScroll],
  );

  const onGenerate = useCallback(() => throttledGenerate.call(), [throttledGenerate]);

  useEffect(() => {
    fluxIDEvents.on('update-user', setUser);

    return () => {
      fluxIDEvents.off('update-user', setUser);
    };
  }, []);

  const handleTabChange = (key: string) => {
    if ((key === 'history' && !showHistory) || (key === 'editor' && showHistory)) {
      toggleHistory();
    }
  };

  useEffect(() => {
    if (hasInitializedStyle.current || aiStyles.length === 0) return;

    const categories = aiConfig?.categories || [];
    const firstStyle = getDefaultStyle(aiStyles, categories);

    if (firstStyle && firstStyle.id !== 'customize') {
      setStyle(firstStyle.id, aiStyles);
      hasInitializedStyle.current = true;
    }
  }, [aiConfig, aiStyles, setStyle]);

  // Render content based on state
  const renderContent = () => {
    if (isFetching) {
      return <LoadingView />;
    }

    if (isError) {
      return <ErrorView onRetry={() => refetch()} />;
    }

    if (showHistory) {
      return (
        <div className={styles.content}>
          <ImageHistory />
        </div>
      );
    }

    return (
      <div className={classNames(styles.content, styles['with-footer'])}>
        <StyleSection onClick={() => setShowStyleSelector(true)} onReset={resetForm} styleConfig={styleConfig} t={t} />

        {getInputFieldsForStyle(styleId, aiStyles).map((field) => {
          const isUpload = field.key === 'description' && styleConfig?.modes?.includes('edit');

          return (
            <div className={styles.section} key={field.key}>
              <h3 className={styles['section-title']}>
                {field.label} {field.required && <span className={styles.required}>*</span>}
              </h3>
              {isUpload ? (
                <InputWithUpload
                  field={field}
                  imageInputs={imageInputs}
                  onAddImage={addImageInput}
                  onChange={(val) => setInputField(field.key, val)}
                  onKeyDown={handleTextAreaKeyDown}
                  onRemoveImage={removeImageInput}
                  value={inputFields[field.key] || ''}
                />
              ) : (
                <InputField
                  field={field}
                  onChange={(val) => setInputField(field.key, val)}
                  onKeyDown={handleTextAreaKeyDown}
                  rows={field.key === 'description' ? 5 : 3}
                  value={inputFields[field.key] || ''}
                />
              )}
            </div>
          );
        })}

        <div className={styles['section-row']}>
          <RatioSection dimensions={dimensions} onClick={() => setShowRatioSelector(true)} t={t} />
          <SizeSection dimensions={dimensions} onClick={() => setShowSizeSelector(true)} t={t} />
        </div>
        <CountSection maxImages={maxImages} onClick={() => setShowCountSelector(true)} t={t} />
        <ToggleSection checked={isLaserFriendly} label={t.form.laser_friendly} onChange={toggleLaserFriendly} />
        <ImageResults
          errorMessage={errorMessage}
          generatedImages={generatedImages}
          generationStatus={generationStatus}
        />
      </div>
    );
  };

  const showFooter = !isFetching && !isError && !showHistory;

  return (
    <ConfigProvider theme={{ token: { borderRadius: 6, borderRadiusLG: 6 } }}>
      <FloatingPanel
        anchors={anchors}
        className={styles.panel}
        fixedContent={
          !isFetching && !isError && <Header onTabChange={handleTabChange} showHistory={showHistory} t={t} />
        }
        onClose={onClose}
        onReady={setPanelHandle}
        title={t.header.title}
      >
        {renderContent()}

        {showFooter && (
          <Footer
            buyLink={lang.beambox.popup.ai_credit.buy_link}
            isDisabled={isGenerateDisabled}
            maxImages={maxImages}
            onGenerate={onGenerate}
            t={t}
            user={user}
          />
        )}
      </FloatingPanel>

      <Popup
        bodyClassName={styles['popup-body']}
        bodyStyle={{ height: '80vh' }}
        className={styles.popup}
        onMaskClick={() => setShowStyleSelector(false)}
        position="bottom"
        visible={showStyleSelector}
      >
        <MobileStyleSelector onClose={() => setShowStyleSelector(false)} />
      </Popup>

      <Popup
        bodyClassName={styles['popup-body']}
        className={styles.popup}
        onMaskClick={() => setShowRatioSelector(false)}
        position="bottom"
        visible={showRatioSelector}
      >
        <UniformSelector
          columns={2}
          onClose={() => setShowRatioSelector(false)}
          onSelect={handleRatioSelect}
          options={getRatioOptions()}
          selectedValue={dimensions.aspectRatio}
          title={t.dimensions.ratio}
          variant="default"
        />
      </Popup>

      <Popup
        bodyClassName={styles['popup-body']}
        className={styles.popup}
        onMaskClick={() => setShowSizeSelector(false)}
        position="bottom"
        visible={showSizeSelector}
      >
        <UniformSelector
          columns={1}
          onClose={() => setShowSizeSelector(false)}
          onSelect={handleSizeSelect}
          options={getSizeOptions(dimensions)}
          selectedValue={dimensions.size}
          title={t.dimensions.resolution}
          variant="detailed"
        />
      </Popup>

      <Popup
        bodyClassName={styles['popup-body']}
        className={styles.popup}
        onMaskClick={() => setShowCountSelector(false)}
        position="bottom"
        visible={showCountSelector}
      >
        <UniformSelector
          columns={2}
          onClose={() => setShowCountSelector(false)}
          onSelect={handleCountSelect}
          options={getCountOptions()}
          selectedValue={maxImages}
          title={t.form.count}
          variant="compact"
        />
      </Popup>
    </ConfigProvider>
  );
});

export default MobileAiGenerate;
