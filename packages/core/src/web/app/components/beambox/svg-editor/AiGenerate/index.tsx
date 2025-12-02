import React, { memo, useEffect, useState } from 'react';

import { BulbOutlined, ClockCircleOutlined, CloseOutlined, ReloadOutlined } from '@ant-design/icons';
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

const { TextArea } = Input;

const UnmemorizedAiGenerate = () => {
  const [currentUser, setCurrentUser] = useState<IUser | null>(getCurrentUser());
  const { info } = currentUser || { info: null };

  // TanStack Query for AI config (styles & categories)
  const {
    data: aiConfig,
    error: configQueryError,
    isError: isConfigError,
    isLoading: isConfigLoading,
    refetch: refetchConfig,
  } = useAiConfigQuery();

  // Provide defaults when data is undefined (during loading)
  const aiStyles = aiConfig?.styles ?? [];
  const stylesWithFields = aiConfig?.stylesWithFields ?? [];

  const {
    // Form state
    addImageInput,
    dimensions,
    errorMessage,
    generatedImages,
    generationStatus,
    imageInputs: selectedImageInputs,
    inputFields,
    isAiGenerateShown,
    isLaserFriendly,
    maxImages,
    removeImageInput,
    resetForm,
    setInputField,
    setStyle,
    showHistory,
    style,
    toggleHistory,
    toggleLaserFriendly,
  } = useAiGenerateStore();

  const optionConfig = getStyleConfig(style, aiStyles);
  const stylePreset = optionConfig?.id || 'plain';

  // Image generation logic
  const { handleGenerate } = useImageGeneration({
    currentUser,
    dimensions,
    maxImages,
    style: stylePreset,
    stylesWithFields,
  });

  // Subscribe to user update events for real-time credit balance updates
  useEffect(() => {
    const handleUserUpdate = (user: IUser | null) => {
      setCurrentUser(user);
    };

    fluxIDEvents.on('update-user', handleUserUpdate);

    return () => {
      fluxIDEvents.off('update-user', handleUserUpdate);
    };
  }, []);

  const handleClose = () => {
    useAiGenerateStore.setState({ isAiGenerateShown: false });
  };

  const handleRefresh = () => {
    resetForm();
  };

  const handleStyleClick = () => {
    dialogCaller.showStyleSelectionPanel((selectedStyle) => {
      setStyle(selectedStyle, stylesWithFields);
    }, style);
  };

  const handleTextAreaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();

    // Check for Fnkey+a (Cmd+a on Mac, Ctrl+a on Windows)
    const isFnkeyA = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a';

    if (isFnkeyA) {
      e.preventDefault();

      const textarea = e.currentTarget;

      textarea.select();
    }

    // Check for Escape to blur (unfocus) the textarea
    if (e.key === 'Escape') {
      e.preventDefault();

      const textarea = e.currentTarget;

      textarea.blur();
    }
  };

  // TanStack Query automatically fetches on mount, no manual loading needed

  useEffect(() => {
    if (!isAiGenerateShown) return;

    const exitScope = shortcuts.enterScope();
    const subscribedShortcuts = [shortcuts.on(['Escape'], handleClose, { isBlocking: true })];

    return () => {
      subscribedShortcuts.forEach((unregister) => unregister());
      exitScope();
    };
  }, [isAiGenerateShown]);

  // Show loading state while config is being fetched
  if (isConfigLoading) {
    return (
      <div className={classNames(cssStyles['ai-generate-container'])}>
        <div className={cssStyles.header}>
          <h2 className={cssStyles.title}>AI Create</h2>
          <div className={cssStyles.actions}>
            <Button
              className={cssStyles['icon-button']}
              icon={<CloseOutlined />}
              onClick={handleClose}
              shape="circle"
              type="text"
            />
          </div>
        </div>
        <div className={cssStyles.content}>
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Spin size="large" tip="Loading AI styles..." />
          </div>
        </div>
      </div>
    );
  }

  // Show error state if config failed to load
  if (isConfigError) {
    return (
      <div className={classNames(cssStyles['ai-generate-container'])}>
        <div className={cssStyles.header}>
          <h2 className={cssStyles.title}>AI Create</h2>
          <div className={cssStyles.actions}>
            <Button
              className={cssStyles['icon-button']}
              icon={<CloseOutlined />}
              onClick={handleClose}
              shape="circle"
              type="text"
            />
          </div>
        </div>
        <div className={cssStyles.content}>
          <Alert
            action={
              <Button onClick={() => refetchConfig()} size="small" type="primary">
                Retry
              </Button>
            }
            description={configQueryError?.message || 'Failed to load AI configuration'}
            message="Failed to load AI styles"
            showIcon
            type="error"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={classNames(cssStyles['ai-generate-container'])}>
      <div className={cssStyles.header}>
        <h2 className={cssStyles.title}>AI Create</h2>
        <div className={cssStyles.actions}>
          <Button
            className={classNames(cssStyles['icon-button'], {
              [cssStyles.active]: showHistory,
            })}
            icon={<ClockCircleOutlined />}
            onClick={toggleHistory}
            shape="circle"
            type="text"
          />
          <Button
            className={cssStyles['icon-button']}
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            shape="circle"
            type="text"
          />
          <Button
            className={cssStyles['icon-button']}
            icon={<CloseOutlined />}
            onClick={handleClose}
            shape="circle"
            type="text"
          />
        </div>
      </div>

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
                icon={<BulbOutlined />}
                onClick={handleStyleClick}
                size="large"
              >
                <div className={cssStyles['button-content']}>
                  <span className={cssStyles['button-label']}>
                    {optionConfig?.displayName || 'Select Creation Style'}
                  </span>
                </div>
              </Button>
            </div>

            {optionConfig?.modes?.includes('edit') && (
              <div className={cssStyles.section}>
                <h3 className={cssStyles['section-title']}>Upload Images</h3>
                <ImageUploadArea imageInputs={selectedImageInputs} onAdd={addImageInput} onRemove={removeImageInput} />
              </div>
            )}

            {stylePreset &&
              getInputFieldsForStyle(stylePreset, stylesWithFields).map((field) => (
                <div className={cssStyles.section} key={field.key}>
                  <h3 className={cssStyles['section-title']}>
                    {field.label}
                    {field.required && <span className={cssStyles.required}> *</span>}
                  </h3>
                  <div className={cssStyles['input-wrapper']}>
                    <TextArea
                      className={cssStyles.textarea}
                      maxLength={field.maxLength}
                      onChange={(e) => {
                        setInputField(field.key, e.target.value);
                      }}
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
                onChange={(value) => useAiGenerateStore.setState({ maxImages: value })}
                options={[1, 2, 3, 4].map((num) => ({ label: String(num), value: num }))}
                value={maxImages}
              />
            </div>

            <div className={cssStyles.section}>
              <div className={cssStyles['toggle']}>
                <span>Laser-Friendly</span>
                <Switch checked={isLaserFriendly} onChange={toggleLaserFriendly} />
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
                disabled={!currentUser || (info?.credit || 0) < 0.06 * maxImages || selectedImageInputs.length > 10}
                onClick={handleGenerate}
                size="large"
                type="primary"
              >
                Generate
              </Button>

              <div className={cssStyles['credits-info']}>
                <span className={cssStyles['credits-required']}>Credit required {(0.06 * maxImages).toFixed(2)}</span>
                <div className={cssStyles['credits-balance']}>
                  <FluxIcons.AICredit />
                  <span className={cssStyles['ai-credit']}>{info?.credit || 0}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const AiGenerate = memo(UnmemorizedAiGenerate);

export default AiGenerate;
