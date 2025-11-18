import React, { memo, useEffect, useState } from 'react';

import { BulbOutlined, ClockCircleOutlined, CloseOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Input, Select, Switch } from 'antd';
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
import { useImageGeneration } from './hooks/useImageGeneration';
import styles from './index.module.scss';
import { useAiGenerateStore } from './useAiGenerateStore';
import { getStyleConfig } from './utils/categories';
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
    inputFields,
    isAiGenerateShown,
    isFixedSeed,
    isLaserFriendly,
    removeImageInput,
    resetForm,
    seed,
    selectedImageInputs,
    setInputField,
    setState,
    setStyle,
    showHistory,
    style,
    toggleFixedSeed,
    toggleHistory,
    toggleLaserFriendly,
  } = useAiGenerateStore();

  // Compute mode and stylePreset from selectedOption
  const optionConfig = getStyleConfig(style);
  const mode = optionConfig?.mode || 'text-to-image';
  const stylePreset = optionConfig?.id || null;

  // Image generation logic
  const { handleGenerate } = useImageGeneration({
    count,
    currentUser,
    dimensions,
    mode,
    seed,
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
    dialogCaller.showStyleSelectionPanel((style) => {
      setStyle(style);
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

  useEffect(() => {
    if (!isAiGenerateShown) return;

    const exitScope = shortcuts.enterScope();
    const subscribedShortcuts = [shortcuts.on(['Escape'], handleClose, { isBlocking: true })];

    return () => {
      subscribedShortcuts.forEach((unregister) => unregister());
      exitScope();
    };
  }, [isAiGenerateShown]);

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
                </div>
              </Button>
            </div>

            {mode === 'edit' && (
              <div className={styles.section}>
                <h3 className={styles['section-title']}>Upload Images</h3>
                <ImageUploadArea imageInputs={selectedImageInputs} onAdd={addImageInput} onRemove={removeImageInput} />
              </div>
            )}

            {stylePreset &&
              getStylePreset(stylePreset).map((field) => (
                <div className={styles.section} key={field.key}>
                  <h3 className={styles['section-title']}>
                    {field.label}
                    {field.required && <span className={styles.required}> *</span>}
                  </h3>
                  <div className={styles['input-wrapper']}>
                    <TextArea
                      className={styles.textarea}
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
                      value={inputFields[field.key] || ''}
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

            <div className={styles.section}>
              <div className={styles['toggle']}>
                <span>Use Fixed Seed</span>
                <Switch checked={isFixedSeed} onChange={toggleFixedSeed} />
              </div>
              {isFixedSeed && (
                <div className={styles['seed-input-wrapper']}>
                  <Input
                    className={styles['seed-input']}
                    onChange={(e) => {
                      const value = e.target.value;
                      const numValue = value === '' ? undefined : Number.parseInt(value, 10);

                      if (value === '' || (!Number.isNaN(numValue) && numValue !== undefined && numValue >= 0)) {
                        setState({ seed: numValue });
                      }
                    }}
                    placeholder="Enter seed number (e.g., 12345)"
                    type="number"
                    value={seed ?? ''}
                  />
                </div>
              )}
            </div>

            <div className={styles.section}>
              <div className={styles['toggle']}>
                <span>Laser-Friendly</span>
                <Switch checked={isLaserFriendly} onChange={toggleLaserFriendly} />
              </div>
            </div>

            <ImageResults
              errorMessage={errorMessage}
              generatedImages={generatedImages}
              generationStatus={generationStatus}
            />

            <div className={styles['button-section']}>
              <Button
                block
                className={styles['generate-button']}
                disabled={
                  !currentUser ||
                  (mode === 'edit' && selectedImageInputs.length === 0) ||
                  (mode === 'edit' && selectedImageInputs.length > 10) ||
                  (info?.credit || 0) < 0.06 * count
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
          </>
        )}
      </div>
    </div>
  );
};

const AiGenerate = memo(UnmemorizedAiGenerate);

export default AiGenerate;
