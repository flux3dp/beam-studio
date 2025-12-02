import React, { memo, useEffect, useState } from 'react';

import { BulbOutlined, ClockCircleOutlined, CloseOutlined, ReloadOutlined, RightOutlined } from '@ant-design/icons';
import { Alert, Button, Input, Select, Spin, Switch } from 'antd';
import classNames from 'classnames';

import dialogCaller from '@core/app/actions/dialog-caller';
import FluxIcons from '@core/app/icons/flux/FluxIcons';
import { fluxIDEvents, getCurrentUser } from '@core/helpers/api/flux-id';
import shortcuts from '@core/helpers/shortcuts';
import type { IUser } from '@core/interfaces/IUser';

import DimensionSelector from './components/DimensionSelector';
import ImageHistory from './components/ImageHistory';
import ImageResults from './components/ImageResults';
import ImageUploadArea from './components/ImageUploadArea';
import { useAiConfigQuery } from './hooks/useAiConfigQuery';
import { useImageGeneration } from './hooks/useImageGeneration';
import cssStyles from './index.module.scss';
import { useAiGenerateStore } from './useAiGenerateStore';
import { getStyleConfig } from './utils/categories';
import { getInputFieldsForStyle } from './utils/inputFields';

const AI_COST_PER_IMAGE = 0.06;

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
  const [currentUser, setCurrentUser] = useState<IUser | null>(getCurrentUser());
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
  const stylesWithFields = aiConfig?.stylesWithFields ?? [];
  const aiStyles = aiConfig?.styles ?? [];

  // 2. Logic & Configuration
  const optionConfig = getStyleConfig(style, aiStyles);
  const stylePreset = optionConfig?.id || 'plain';
  const { handleGenerate } = useImageGeneration({
    currentUser,
    dimensions,
    maxImages,
    style: stylePreset,
    stylesWithFields,
  });

  // 3. Effects
  useEffect(() => {
    const update = (user: IUser | null) => setCurrentUser(user);

    fluxIDEvents.on('update-user', update);

    return () => {
      fluxIDEvents.off('update-user', update);
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
  const handleStyleClick = () =>
    dialogCaller.showStyleSelectionPanel((s) => store.setStyle(s, stylesWithFields), style);
  const creditCost = AI_COST_PER_IMAGE * maxImages;
  const canGenerate = currentUser && (currentUser.info?.credit || 0) >= creditCost && imageInputs.length <= 10;

  // 5. Render
  if (isLoading) return <LoadingView onClose={() => store.setState({ isAiGenerateShown: false })} />;

  if (isError) return <ErrorView onClose={() => store.setState({ isAiGenerateShown: false })} onRetry={refetch} />;

  return (
    <div className={classNames(cssStyles['ai-generate-container'])}>
      <Header
        onClose={() => store.setState({ isAiGenerateShown: false })}
        onHistory={store.toggleHistory}
        onRefresh={store.resetForm}
        showHistory={showHistory}
      />

      <div className={cssStyles.content}>
        {showHistory ? (
          <ImageHistory />
        ) : (
          <>
            <div className={cssStyles.section}>
              <h3 className={cssStyles['section-title']}>Style & Mode</h3>
              <Button
                block
                className={cssStyles['style-selection-button']}
                icon={<img alt={optionConfig.displayName} className={cssStyles.img} src={optionConfig.previewImage} />}
                onClick={handleStyleClick}
                size="large"
              >
                <div className={cssStyles['button-content']}>
                  <span className={cssStyles['button-label']}>
                    {optionConfig?.displayName || 'Select Creation Style'}
                  </span>
                  <RightOutlined />
                </div>
              </Button>
            </div>

            {optionConfig?.modes?.includes('edit') && (
              <div className={cssStyles.section}>
                <h3 className={cssStyles['section-title']}>Upload Images</h3>
                <ImageUploadArea
                  imageInputs={imageInputs}
                  onAdd={store.addImageInput}
                  onRemove={store.removeImageInput}
                />
              </div>
            )}

            {stylePreset &&
              getInputFieldsForStyle(stylePreset, stylesWithFields).map((field) => (
                <div className={cssStyles.section} key={field.key}>
                  <h3 className={cssStyles['section-title']}>
                    {field.label} {field.required && <span className={cssStyles.required}>*</span>}
                  </h3>
                  <div className={cssStyles['input-wrapper']}>
                    <Input.TextArea
                      className={cssStyles.textarea}
                      maxLength={field.maxLength}
                      onChange={(e) => store.setInputField(field.key, e.target.value)}
                      onKeyDown={handleTextAreaKeyDown}
                      onKeyUp={(e) => e.stopPropagation()}
                      placeholder={field.placeholder}
                      rows={field.key === 'description' ? 5 : 3}
                      showCount={
                        field.maxLength
                          ? {
                              formatter: ({ count, maxLength }) => (
                                <div className={cssStyles['count-wrapper']}>
                                  <span className={cssStyles.count}>
                                    {count} / {maxLength}
                                  </span>
                                  <BulbOutlined className={cssStyles['bulb-icon']} />
                                </div>
                              ),
                            }
                          : false
                      }
                      value={inputFields[field.key] || ''}
                    />
                  </div>
                </div>
              ))}

            <DimensionSelector dimensions={dimensions} />

            <div className={cssStyles.section}>
              <h3 className={cssStyles['section-title']}>Count</h3>
              <Select
                className={cssStyles['count-select']}
                onChange={(val) => store.setState({ maxImages: val })}
                options={[1, 2, 3, 4].map((n) => ({ label: String(n), value: n }))}
                value={maxImages}
              />
            </div>

            <div className={cssStyles.section}>
              <div className={cssStyles['toggle']}>
                <span>Laser-Friendly</span>
                <Switch checked={isLaserFriendly} onChange={store.toggleLaserFriendly} />
              </div>
            </div>

            <ImageResults
              errorMessage={errorMessage}
              generatedImages={generatedImages}
              generationStatus={generationStatus}
            />

            <div className={cssStyles['button-section']}>
              <Button
                block
                className={cssStyles['generate-button']}
                disabled={!canGenerate}
                onClick={handleGenerate}
                size="large"
                type="primary"
              >
                Generate
              </Button>
              <div className={cssStyles['credits-info']}>
                <span className={cssStyles['credits-required']}>Credit required {creditCost.toFixed(2)}</span>
                <div className={cssStyles['credits-balance']}>
                  <FluxIcons.AICredit />
                  <span className={cssStyles['ai-credit']}>{currentUser?.info?.credit || 0}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const Header = ({ onClose, onHistory, onRefresh, showHistory }: any) => (
  <div className={cssStyles.header}>
    <h2 className={cssStyles.title}>AI Create</h2>
    <div className={cssStyles.actions}>
      <Button
        className={classNames(cssStyles['icon-button'], { [cssStyles.active]: showHistory })}
        icon={<ClockCircleOutlined />}
        onClick={onHistory}
        shape="circle"
        type="text"
      />
      <Button
        className={cssStyles['icon-button']}
        icon={<ReloadOutlined />}
        onClick={onRefresh}
        shape="circle"
        type="text"
      />
      <Button
        className={cssStyles['icon-button']}
        icon={<CloseOutlined />}
        onClick={onClose}
        shape="circle"
        type="text"
      />
    </div>
  </div>
);

const LoadingView = ({ onClose }: { onClose: () => void }) => (
  <div className={classNames(cssStyles['ai-generate-container'])}>
    <Header onClose={onClose} />
    <div className={cssStyles.content} style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
      <Spin size="large" tip="Loading AI styles..." />
    </div>
  </div>
);

const ErrorView = ({ onClose, onRetry }: { onClose: () => void; onRetry: () => void }) => (
  <div className={classNames(cssStyles['ai-generate-container'])}>
    <Header onClose={onClose} />
    <div className={cssStyles.content}>
      <Alert
        action={
          <Button onClick={onRetry} size="small" type="primary">
            Retry
          </Button>
        }
        description="Failed to load AI configuration"
        message="Failed to load AI styles"
        showIcon
        type="error"
      />
    </div>
  </div>
);

export default memo(UnmemorizedAiGenerate);
