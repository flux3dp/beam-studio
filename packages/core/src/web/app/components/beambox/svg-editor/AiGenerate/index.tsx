import React, { memo, useEffect, useState } from 'react';

import { BulbOutlined, ClockCircleOutlined, CloseOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Input, Select } from 'antd';
import classNames from 'classnames';

import dialogCaller from '@core/app/actions/dialog-caller';
import FluxIcons from '@core/app/icons/flux/FluxIcons';
import { fluxIDEvents, getCurrentUser } from '@core/helpers/api/flux-id';
import type { IUser } from '@core/interfaces/IUser';

import DimensionSelector from './components/DimensionSelector';
import ImageHistory from './components/ImageHistory';
import ImageResults from './components/ImageResults';
import ImageUploadArea from './components/ImageUploadArea';
import { useImageGeneration } from './hooks/useImageGeneration';
import styles from './index.module.scss';
import { useAiGenerateStore } from './useAiGenerateStore';
import { getSelectedOptionConfig } from './utils/categories';
import { getStylePreset } from './utils/stylePresets';

const { TextArea } = Input;

const UnmemorizedAiGenerate = () => {
  const [currentUser, setCurrentUser] = useState<IUser | null>(getCurrentUser());
  const { info } = currentUser || { info: null };
  const {
    addImageInput,
    count,
    dimensions,
    errorMessage,
    generatedImages,
    generationStatus,
    patternDescription,
    removeImageInput,
    resetForm,
    selectedImageInputs,
    selectedOption,
    setSelectedOption,
    setStyleCustomField,
    showHistory,
    styleCustomFields,
    toggleHistory,
  } = useAiGenerateStore();

  // Compute mode and stylePreset from selectedOption
  const optionConfig = getSelectedOptionConfig(selectedOption);
  const mode = optionConfig?.mode || 'text-to-image';
  const stylePreset = optionConfig?.stylePreset || null;

  // Image generation logic
  const { handleGenerate } = useImageGeneration({
    count,
    currentUser,
    dimensions,
    mode,
    stylePreset,
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
    dialogCaller.showStyleSelectionPanel((optionId) => {
      setSelectedOption(optionId || null);
    }, selectedOption);
  };

  return (
    <div className={classNames(styles['ai-generate-container'])}>
      <div className={styles.header}>
        <h2 className={styles.title}>AI Create</h2>
        <div className={styles.actions}>
          <Button
            className={classNames(styles['icon-button'], {
              [styles.active]: showHistory,
            })}
            icon={<ClockCircleOutlined />}
            onClick={toggleHistory}
            shape="circle"
            type="text"
          />
          <Button
            className={styles['icon-button']}
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            shape="circle"
            type="text"
          />
          <Button
            className={styles['icon-button']}
            icon={<CloseOutlined />}
            onClick={handleClose}
            shape="circle"
            type="text"
          />
        </div>
      </div>

      <div className={styles.content}>
        {showHistory ? (
          <ImageHistory />
        ) : (
          <>
            <div className={styles.section}>
              <h3 className={styles['section-title']}>Style & Mode</h3>
              <Button
                block
                className={styles['style-selection-button']}
                icon={<BulbOutlined />}
                onClick={handleStyleClick}
                size="large"
              >
                <div className={styles['button-content']}>
                  <span className={styles['button-label']}>{optionConfig?.displayName || 'Select Creation Style'}</span>
                  {/* {optionConfig && <span className={styles['button-description']}>{optionConfig.description}</span>} */}
                </div>
              </Button>
            </div>

            {mode === 'edit' && (
              <div className={styles.section}>
                <h3 className={styles['section-title']}>Upload Images</h3>
                <ImageUploadArea imageInputs={selectedImageInputs} onAdd={addImageInput} onRemove={removeImageInput} />
              </div>
            )}

            <div className={styles.section}>
              <h3 className={styles['section-title']}>{mode === 'edit' ? 'Edit prompt' : 'Pattern description'}</h3>
              <div className={styles['input-wrapper']}>
                <TextArea
                  className={styles.textarea}
                  maxLength={mode === 'edit' ? 5000 : 300}
                  onChange={(e) => useAiGenerateStore.setState({ patternDescription: e.target.value })}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder={
                    stylePreset
                      ? mode === 'edit'
                        ? 'Describe what you want to create (e.g., "A friendly cartoon logo of...")'
                        : 'Describe the main subject (e.g., "A friendly cartoon logo of a shiba dog and a girl")'
                      : mode === 'edit'
                        ? 'Please describe how you would like to edit the images.'
                        : 'Please describe the logo pattern you would like to create.'
                  }
                  rows={5}
                  showCount={{
                    formatter: ({ count: currentCount, maxLength }) => (
                      <div className={styles['count-wrapper']}>
                        <span className={styles.count}>
                          {currentCount} / {maxLength}
                        </span>
                        <BulbOutlined className={styles['bulb-icon']} />
                      </div>
                    ),
                  }}
                  value={patternDescription}
                />
                {mode === 'edit' && selectedImageInputs.length > 0 && (
                  <p className={styles.hint}>
                    💡 Tip: Reference images by number in your prompt (e.g., "person in image 1 wearing clothes from
                    image 2")
                  </p>
                )}
              </div>
            </div>

            {stylePreset &&
              getStylePreset(stylePreset)?.customFields?.map((field) => (
                <div className={styles.section} key={field.key}>
                  <h3 className={styles['section-title']}>
                    {field.label}
                    {field.required && <span className={styles.required}> *</span>}
                  </h3>
                  <div className={styles['input-wrapper']}>
                    <TextArea
                      className={styles.textarea}
                      maxLength={field.maxLength}
                      onChange={(e) => setStyleCustomField(field.key, e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      placeholder={field.placeholder}
                      rows={3}
                      showCount={
                        field.maxLength
                          ? {
                              formatter: ({ count: currentCount, maxLength }) => (
                                <div className={styles['count-wrapper']}>
                                  <span className={styles.count}>
                                    {currentCount} / {maxLength}
                                  </span>
                                  <BulbOutlined className={styles['bulb-icon']} />
                                </div>
                              ),
                            }
                          : false
                      }
                      value={styleCustomFields[field.key] || ''}
                    />
                  </div>
                </div>
              ))}

            <DimensionSelector dimensions={dimensions} />

            <div className={styles.section}>
              <h3 className={styles['section-title']}>Count</h3>
              <Select
                className={styles['count-select']}
                onChange={(value) => useAiGenerateStore.setState({ count: value })}
                options={[1, 2, 3, 4].map((num) => ({ label: String(num), value: num }))}
                value={count}
              />
            </div>

            <div className={styles['button-section']}>
              <Button
                block
                className={styles['generate-button']}
                disabled={
                  !patternDescription.trim() ||
                  !currentUser ||
                  (mode === 'edit' && selectedImageInputs.length === 0) ||
                  (mode === 'edit' && selectedImageInputs.length > 10) ||
                  (info?.credit || 0) < 0.05 * count
                }
                onClick={handleGenerate}
                size="large"
                type="primary"
              >
                Generate
              </Button>

              <div className={styles['credits-info']}>
                <span className={styles['credits-required']}>Credit required {(0.05 * count).toFixed(2)}</span>
                <div className={styles['credits-balance']}>
                  <FluxIcons.AICredit />
                  <span className={styles['ai-credit']}>{info?.credit || 0}</span>
                </div>
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
    </div>
  );
};

const AiGenerate = memo(UnmemorizedAiGenerate);

export default AiGenerate;
