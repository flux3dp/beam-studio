import React, { memo, useEffect, useMemo, useRef, useState } from 'react';

import { ReloadOutlined, RightOutlined } from '@ant-design/icons';
import { Button, ConfigProvider, Select, Switch } from 'antd';
import { Popup, Tabs } from 'antd-mobile';
import classNames from 'classnames';
import { funnel } from 'remeda';

import layoutConstants from '@core/app/constants/layout-constants';
import FluxIcons from '@core/app/icons/flux/FluxIcons';
import FloatingPanel from '@core/app/widgets/FloatingPanel';
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
import { AI_COST_PER_IMAGE } from '../types';
import { useAiGenerateStore } from '../useAiGenerateStore';
import { getDefaultStyle, getStyleConfig } from '../utils/categories';
import { handleImageGeneration } from '../utils/handleImageGeneration';
import { getInputFieldsForStyle } from '../utils/inputFields';

import MobileRatioSelector from './components/MobileRatioSelector';
import MobileSizeSelector from './components/MobileSizeSelector';
import MobileStyleSelector from './components/MobileStyleSelector';
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
  <div className={styles.section}>
    <h3 className={styles['section-title']}>{t.dimensions.ratio}</h3>
    <Button block className={styles['ratio-button']} onClick={onClick} size="large">
      <div className={styles['ratio-preview']}>
        <div className={styles[`ratio-${dimensions.aspectRatio.replace(':', '-')}`]} />
        <span>{dimensions.aspectRatio}</span>
      </div>
      <RightOutlined />
    </Button>
  </div>
);

const SizeSection = ({ dimensions, onClick, t }: any) => (
  <div className={styles.section}>
    <h3 className={styles['section-title']}>{t.dimensions.resolution}</h3>
    <Button block className={styles['size-button']} onClick={onClick} size="large">
      <span className={styles['size-label']}>{dimensions.size}</span>
      <RightOutlined />
    </Button>
  </div>
);

const CountSection = ({ maxImages, onChange, t }: any) => (
  <div className={styles.section}>
    <h3 className={styles['section-title']}>{t.form.count}</h3>
    <Select
      className={styles['count-select']}
      onChange={(val) => onChange({ maxImages: val })}
      options={[1, 2, 3, 4].map((n) => ({ label: `${n} Image${n > 1 ? 's' : ''}`, value: n }))}
      size="large"
      value={maxImages}
    />
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

const GENERATE_BUTTON_COOLDOWN_MS = 2000;

const handleTextAreaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
  e.stopPropagation();

  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') {
    e.preventDefault();
    e.currentTarget.select();
  }

  if (e.key === 'Escape') {
    e.preventDefault();
    e.currentTarget.blur();
  }
};

interface Props {
  onClose: () => void;
}

const UnmemorizedMobileAiGenerate = ({ onClose }: Props) => {
  const lang = useI18n();
  const t = lang.beambox.ai_generate;
  const [user, setUser] = useState<IUser | null>(getCurrentUser());
  const [isGenerateDisabled, setIsGenerateDisabled] = useState(false);
  const [showStyleSelector, setShowStyleSelector] = useState(false);
  const [showRatioSelector, setShowRatioSelector] = useState(false);
  const [showSizeSelector, setShowSizeSelector] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const anchors = [0, window.innerHeight - layoutConstants.menuberHeight];
  const store = useAiGenerateStore();
  const { data: aiConfig, isError, isFetching, refetch } = useAiConfigQuery();
  const aiStyles = useMemo(() => aiConfig?.styles || [], [aiConfig?.styles]);
  const styleConfig = getStyleConfig(store.style, aiStyles);
  const styleId = styleConfig?.id || 'customize';
  // Throttled Generate
  const paramsRef = useRef({ style: styleId, styles: aiStyles, user });
  // Auto-select default style on first open
  const hasInitializedStyle = useRef(false);

  paramsRef.current = { style: styleId, styles: aiStyles, user };

  const throttledGenerate = useRef(
    funnel(
      () => {
        setIsGenerateDisabled(true);
        handleImageGeneration(paramsRef.current);
        requestAnimationFrame(() => contentRef.current?.scrollTo({ behavior: 'smooth', top: 1000 }));
        setTimeout(() => setIsGenerateDisabled(false), GENERATE_BUTTON_COOLDOWN_MS);
      },
      { minGapMs: GENERATE_BUTTON_COOLDOWN_MS, triggerAt: 'start' },
    ),
  );

  useEffect(() => {
    fluxIDEvents.on('update-user', setUser);

    return () => {
      fluxIDEvents.off('update-user', setUser);
    };
  }, []);

  const handleTabChange = (key: string) => {
    if ((key === 'history' && !store.showHistory) || (key === 'editor' && store.showHistory)) {
      store.toggleHistory();
    }
  };

  useEffect(() => {
    if (hasInitializedStyle.current || aiStyles.length === 0) return;

    const categories = aiConfig?.categories || [];
    const firstStyle = getDefaultStyle(aiStyles, categories);

    if (firstStyle && firstStyle.id !== 'customize') {
      store.setStyle(firstStyle.id, aiStyles);
      hasInitializedStyle.current = true;
    }
  }, [aiConfig, aiStyles, store]);

  if (isFetching) {
    return (
      <FloatingPanel anchors={anchors} className={styles.panel} onClose={onClose} title={t.header.title}>
        <LoadingView contentRef={contentRef} />
      </FloatingPanel>
    );
  }

  if (isError) {
    return (
      <FloatingPanel anchors={anchors} className={styles.panel} onClose={onClose} title={t.header.title}>
        <ErrorView contentRef={contentRef} onRetry={refetch} />
      </FloatingPanel>
    );
  }

  return (
    <ConfigProvider theme={{ token: { borderRadius: 6, borderRadiusLG: 6 } }}>
      <FloatingPanel
        anchors={anchors}
        className={styles.panel}
        fixedContent={<Header onTabChange={handleTabChange} showHistory={store.showHistory} t={t} />}
        onClose={onClose}
        title={t.header.title}
      >
        <div className={classNames(styles.content, { [styles['with-footer']]: !store.showHistory })} ref={contentRef}>
          {store.showHistory ? (
            <ImageHistory />
          ) : (
            <>
              <StyleSection
                onClick={() => setShowStyleSelector(true)}
                onReset={store.resetForm}
                styleConfig={styleConfig}
                t={t}
              />

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
                        imageInputs={store.imageInputs}
                        onAddImage={store.addImageInput}
                        onChange={(val) => store.setInputField(field.key, val)}
                        onKeyDown={handleTextAreaKeyDown}
                        onRemoveImage={store.removeImageInput}
                        value={store.inputFields[field.key] || ''}
                      />
                    ) : (
                      <InputField
                        field={field}
                        onChange={(val) => store.setInputField(field.key, val)}
                        onKeyDown={handleTextAreaKeyDown}
                        rows={field.key === 'description' ? 5 : 3}
                        value={store.inputFields[field.key] || ''}
                      />
                    )}
                  </div>
                );
              })}

              <RatioSection dimensions={store.dimensions} onClick={() => setShowRatioSelector(true)} t={t} />
              <SizeSection dimensions={store.dimensions} onClick={() => setShowSizeSelector(true)} t={t} />
              <CountSection maxImages={store.maxImages} onChange={store.setState} t={t} />
              <ToggleSection
                checked={store.isLaserFriendly}
                label={t.form.laser_friendly}
                onChange={store.toggleLaserFriendly}
              />
              <ImageResults
                errorMessage={store.errorMessage}
                generatedImages={store.generatedImages}
                generationStatus={store.generationStatus}
              />
            </>
          )}
        </div>

        {!store.showHistory && (
          <Footer
            buyLink={lang.beambox.popup.ai_credit.buy_link}
            isDisabled={isGenerateDisabled}
            maxImages={store.maxImages}
            onGenerate={() => throttledGenerate.current.call()}
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
        <MobileRatioSelector onClose={() => setShowRatioSelector(false)} />
      </Popup>

      <Popup
        bodyClassName={styles['popup-body']}
        className={styles.popup}
        onMaskClick={() => setShowSizeSelector(false)}
        position="bottom"
        visible={showSizeSelector}
      >
        <MobileSizeSelector onClose={() => setShowSizeSelector(false)} />
      </Popup>
    </ConfigProvider>
  );
};

export default memo(UnmemorizedMobileAiGenerate);
