import React, { memo, useState } from 'react';

import { ReloadOutlined, RightOutlined } from '@ant-design/icons';
import { Button, ConfigProvider, Switch } from 'antd';
import { Popup, Tabs } from 'antd-mobile';
import classNames from 'classnames';

import layoutConstants from '@core/app/constants/layout-constants';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import FloatingPanel, { type FloatingPanelHandle } from '@core/app/widgets/FloatingPanel';
import useI18n from '@core/helpers/useI18n';

import ErrorView from '../components/ErrorView';
import ImageHistory from '../components/ImageHistory';
import ImageResults from '../components/ImageResults';
import InputFieldsSection from '../components/InputFieldsSection';
import LoadingView from '../components/LoadingView';
import StickyFooter from '../components/StickyFooter';
import { useAiConfigQuery } from '../hooks/useAiConfigQuery';
import { useAiGenerateEffects } from '../hooks/useAiGenerateEffects';
import { useAiGenerateStore } from '../useAiGenerateStore';
import { getStyleConfig } from '../utils/categories';

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

const SectionButton = ({
  icon,
  label,
  onClick,
  subLabel,
}: {
  icon?: React.ReactNode;
  label: number | string;
  onClick: () => void;
  subLabel?: string;
}) => (
  <Button block className={styles['section-button']} onClick={onClick} size="large">
    <div className={styles['button-content']}>
      {icon && <div className={styles['icon-wrapper']}>{icon}</div>}
      <span className={styles['label']}>{label}</span>
      {subLabel && <span className={styles['sub-label']}>{subLabel}</span>}
    </div>
    <RightOutlined />
  </Button>
);

const SelectorPopup = ({
  children,
  onClose,
  visible,
}: {
  children: React.ReactNode;
  onClose: () => void;
  visible: boolean;
}) => (
  <Popup
    bodyClassName={styles['popup-body']}
    className={styles.popup}
    onMaskClick={onClose}
    position="bottom"
    visible={visible}
  >
    {children}
  </Popup>
);

const MobileAiGenerate = memo(() => {
  const lang = useI18n();
  const t = lang.beambox.ai_generate;
  const anchors = [0, window.innerHeight - layoutConstants.menubarHeight];
  const [panelHandle, setPanelHandle] = useState<FloatingPanelHandle | null>(null);
  const [activeSelector, setActiveSelector] = useState<'count' | 'none' | 'ratio' | 'size' | 'style'>('none');
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
    setInputField,
    showHistory,
    styleId,
    toggleHistory,
    toggleLaserFriendly,
    user,
  } = useAiGenerateStore();
  const { setDrawerMode } = useCanvasStore();
  const {
    data: { styles: aiStyles },
    isError,
    isFetching,
    refetch,
  } = useAiConfigQuery();
  const { isGenerateDisabled, onGenerate, showFooter } = useAiGenerateEffects({ scrollTarget: panelHandle });
  const style = getStyleConfig(styleId, aiStyles);
  const closeSelector = () => setActiveSelector('none');

  const handleTabChange = (key: string) => {
    if ((key === 'history' && !showHistory) || (key === 'editor' && showHistory)) {
      toggleHistory();
    }
  };

  const renderContent = () => {
    if (isFetching) return <LoadingView />;

    if (isError) return <ErrorView onRetry={() => refetch()} />;

    if (showHistory) {
      return (
        <div className={styles.content}>
          <ImageHistory />
        </div>
      );
    }

    return (
      <div className={classNames(styles.content, styles['with-footer'])}>
        {/* Style Selection */}
        <div className={styles.section}>
          <div className={styles['section-header']}>
            <h3 className={styles['section-title']}>{t.style.choose}</h3>
            <Button className={styles['reset-button']} icon={<ReloadOutlined />} onClick={resetForm} type="text" />
          </div>
          <Button
            block
            className={styles['style-selection-button']}
            onClick={() => setActiveSelector('style')}
            size="large"
          >
            {style.previewImage && (
              <img alt={style.displayName} className={styles['style-img']} src={style.previewImage} />
            )}
            <div className={styles['button-content']}>
              <span className={styles['button-label']}>{style.displayName || t.style.select}</span>
              <RightOutlined />
            </div>
          </Button>
        </div>

        {/* Input Fields */}
        <InputFieldsSection
          aiStyles={aiStyles}
          className={styles.section}
          imageInputs={imageInputs}
          inputFields={inputFields}
          onAddImage={addImageInput}
          onFieldChange={setInputField}
          onRemoveImage={removeImageInput}
          style={style}
          styleId={styleId}
        />

        {/* Dimensions & Count */}
        <div className={styles['section-row']}>
          <div className={styles['section-half']}>
            <h3 className={styles['section-title']}>{t.dimensions.ratio}</h3>
            <SectionButton
              icon={<div className={styles[`ratio-${dimensions.aspectRatio.replace(':', '-')}`]} />}
              label={dimensions.aspectRatio}
              onClick={() => setActiveSelector('ratio')}
            />
          </div>
          <div className={styles['section-half']}>
            <h3 className={styles['section-title']}>{t.dimensions.resolution}</h3>
            <SectionButton label={dimensions.size} onClick={() => setActiveSelector('size')} />
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles['section-title']}>{t.form.count}</h3>
          <SectionButton label={maxImages} onClick={() => setActiveSelector('count')} />
        </div>

        {/* Toggles */}
        <div className={styles.section}>
          <div className={styles.toggle}>
            <span>{t.form.laser_friendly}</span>
            <Switch checked={isLaserFriendly} onChange={toggleLaserFriendly} />
          </div>
        </div>

        <ImageResults
          errorMessage={errorMessage}
          generatedImages={generatedImages}
          generationStatus={generationStatus}
        />
      </div>
    );
  };

  return (
    <ConfigProvider theme={{ token: { borderRadius: 6, borderRadiusLG: 6 } }}>
      <FloatingPanel
        anchors={anchors}
        className={styles.panel}
        fixedContent={
          <div className={styles.header}>
            <Tabs
              activeKey={showHistory ? 'history' : 'editor'}
              activeLineMode="full"
              className={styles.tabs}
              onChange={handleTabChange}
              style={{ '--title-font-size': '16px' }}
            >
              <Tabs.Tab key="editor" title={t.form.editor} />
              <Tabs.Tab key="history" title={t.header.history_tooltip} />
            </Tabs>
          </div>
        }
        onClose={() => setDrawerMode('none')}
        onReady={setPanelHandle}
        title={t.header.title}
      >
        {renderContent()}

        {showFooter && (
          <StickyFooter
            buyLink={lang.beambox.popup.ai_credit.buy_link}
            className={styles.footer}
            isDisabled={isGenerateDisabled}
            maxImages={maxImages}
            onGenerate={onGenerate}
            user={user}
          />
        )}
      </FloatingPanel>

      {/* Popups */}
      <Popup
        bodyClassName={styles['popup-body']}
        bodyStyle={{ height: '80vh' }}
        className={styles.popup}
        onMaskClick={closeSelector}
        position="bottom"
        visible={activeSelector === 'style'}
      >
        <MobileStyleSelector onClose={closeSelector} />
      </Popup>

      <SelectorPopup onClose={closeSelector} visible={activeSelector === 'ratio'}>
        <UniformSelector
          columns={2}
          onClose={closeSelector}
          onSelect={handleRatioSelect}
          options={getRatioOptions()}
          selectedValue={dimensions.aspectRatio}
          title={t.dimensions.ratio}
          variant="default"
        />
      </SelectorPopup>

      <SelectorPopup onClose={closeSelector} visible={activeSelector === 'size'}>
        <UniformSelector
          columns={1}
          onClose={closeSelector}
          onSelect={handleSizeSelect}
          options={getSizeOptions(dimensions)}
          selectedValue={dimensions.size}
          title={t.dimensions.resolution}
          variant="detailed"
        />
      </SelectorPopup>

      <SelectorPopup onClose={closeSelector} visible={activeSelector === 'count'}>
        <UniformSelector
          columns={2}
          onClose={closeSelector}
          onSelect={handleCountSelect}
          options={getCountOptions()}
          selectedValue={maxImages}
          title={t.form.count}
          variant="compact"
        />
      </SelectorPopup>
    </ConfigProvider>
  );
});

export default MobileAiGenerate;
