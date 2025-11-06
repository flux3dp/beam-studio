import React, { memo, useEffect, useRef, useState } from 'react';

import { BulbOutlined, ClockCircleOutlined, CloseOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Input, Select, Space } from 'antd';
import classNames from 'classnames';
import { createPortal } from 'react-dom';
import { match } from 'ts-pattern';

import dialogCaller from '@core/app/actions/dialog-caller';
import FluxIcons from '@core/app/icons/flux/FluxIcons';
import type { ImageResolution, ImageSizeOption } from '@core/helpers/api/ai-image';
import { createImageEditTask, createTextToImageTask, pollTaskUntilComplete } from '@core/helpers/api/ai-image';
import { fluxIDEvents, getCurrentUser, getInfo } from '@core/helpers/api/flux-id';
import type { IUser } from '@core/interfaces/IUser';

import ImageHistory from './components/ImageHistory';
import ImageResults from './components/ImageResults';
import ImageUploadArea from './components/ImageUploadArea';
import styles from './index.module.scss';
import type { AspectRatio, ImageDimensions, ImageSize, Orientation } from './useAiGenerateStore';
import { useAiGenerateStore } from './useAiGenerateStore';
import { getSelectedOptionConfig } from './utils/categories';
import { buildStyledPrompt, getStylePreset } from './utils/stylePresets';

const { TextArea } = Input;

interface RatioOption {
  displayLabel: string;
  orientation: Orientation;
  ratio: AspectRatio;
}

// All available ratio options - first 3 are always displayed, rest are in "More" menu
const ALL_RATIOS: RatioOption[] = [
  // Always displayed ratios
  { displayLabel: '1:1', orientation: 'landscape', ratio: '1:1' },
  { displayLabel: '4:3', orientation: 'landscape', ratio: '4:3' },
  { displayLabel: '16:9', orientation: 'landscape', ratio: '16:9' },
  // Additional ratios (in "More" menu)
  { displayLabel: '3:2', orientation: 'landscape', ratio: '3:2' },
  { displayLabel: '3:4', orientation: 'portrait', ratio: '4:3' },
  { displayLabel: '2:3', orientation: 'portrait', ratio: '3:2' },
  { displayLabel: '9:16', orientation: 'portrait', ratio: '16:9' },
];

const ALWAYS_DISPLAYED_COUNT = 3;
const ALWAYS_DISPLAYED_RATIOS = ALL_RATIOS.slice(0, ALWAYS_DISPLAYED_COUNT);
const ADDITIONAL_RATIOS = ALL_RATIOS.slice(ALWAYS_DISPLAYED_COUNT);

const UnmemorizedAiGenerate = () => {
  const [currentUser, setCurrentUser] = useState<IUser | null>(getCurrentUser());
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState<null | { left: number; top: number }>(null);
  const moreButtonRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { info } = currentUser || { info: null };
  const {
    addImageInput,
    addPendingHistoryItem,
    clearGenerationResults,
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
    updateHistoryItem,
  } = useAiGenerateStore();

  // Compute mode and stylePreset from selectedOption
  const optionConfig = getSelectedOptionConfig(selectedOption);
  const mode = optionConfig?.mode || 'text-to-image';
  const stylePreset = optionConfig?.stylePreset || null;

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

  // Hover handlers for floating menu with delayed close
  const handleMoreButtonEnter = () => {
    // Clear any pending close timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    // Calculate menu position
    if (moreButtonRef.current) {
      const rect = moreButtonRef.current.getBoundingClientRect();

      setMenuPosition({ left: rect.left + 86, top: rect.top });
    }

    setShowMoreMenu(true);
  };

  const handleMoreButtonLeave = () => {
    // Delay closing the menu to give user time to reach it
    closeTimeoutRef.current = setTimeout(() => {
      setShowMoreMenu(false);
      setMenuPosition(null);
    }, 300);
  };

  const handleMenuEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const handleMenuLeave = () => {
    setShowMoreMenu(false);
    setMenuPosition(null);
  };

  useEffect(
    () => () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    },
    [],
  );

  const getSizePixels = ({ aspectRatio, orientation, size }: ImageDimensions): string => {
    // Get maximum dimension based on size
    const maxDimension = match(size)
      .with('small', () => 1024)
      .with('medium', () => 2048)
      .with('large', () => 4096)
      .exhaustive();

    // Handle square ratio
    if (aspectRatio === '1:1') {
      return `${maxDimension} x ${maxDimension}`;
    }

    // Parse and calculate based on orientation
    const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);
    const ratio = widthRatio / heightRatio;
    let width: number;
    let height: number;

    if (orientation === 'landscape') {
      width = maxDimension;
      height = Math.round(width / ratio);
    } else {
      height = maxDimension;
      width = Math.round(height / ratio);
    }

    return `${width} x ${height}`;
  };

  const getImageSizeOption = (): ImageSizeOption =>
    match(dimensions)
      .with({ aspectRatio: '1:1' }, () => 'square_hd' as ImageSizeOption)
      .otherwise(
        ({ aspectRatio, orientation }) => `${orientation}_${aspectRatio.replace(':', '_')}` as ImageSizeOption,
      );

  const getImageResolution = (): ImageResolution =>
    match(dimensions.size)
      .with('small', () => '1K' as ImageResolution)
      .with('medium', () => '2K' as ImageResolution)
      .with('large', () => '4K' as ImageResolution)
      .exhaustive();

  // Check if current selection matches any of the additional ratios in the "More" menu
  const isAdditionalRatioSelected = (): boolean =>
    ADDITIONAL_RATIOS.some(
      (option) => option.ratio === dimensions.aspectRatio && option.orientation === dimensions.orientation,
    );

  const handleGenerate = async () => {
    if (!patternDescription.trim()) {
      useAiGenerateStore.setState({ errorMessage: 'Please provide a prompt description' });

      return;
    }

    // Validate edit mode requirements
    if (mode === 'edit' && selectedImageInputs.length === 0) {
      useAiGenerateStore.setState({ errorMessage: 'Please upload at least one image for editing' });

      return;
    }

    if (mode === 'edit' && selectedImageInputs.length > 10) {
      useAiGenerateStore.setState({ errorMessage: 'Maximum 10 images allowed' });

      return;
    }

    // Check if user is logged in
    if (!currentUser) {
      useAiGenerateStore.setState({ errorMessage: 'Please log in to use AI generation.' });

      return;
    }

    // Clear previous results
    clearGenerationResults();
    useAiGenerateStore.setState({ generationStatus: 'generating' });

    // Build prompt
    let prompt: string;

    if (stylePreset) {
      // Style mode: construct weighted JSON prompt
      const preset = getStylePreset(stylePreset);

      if (!preset) {
        useAiGenerateStore.setState({ errorMessage: 'Invalid style preset selected' });

        return;
      }

      prompt = buildStyledPrompt(preset, patternDescription.trim(), styleCustomFields);
    } else {
      // Plain mode: use pattern description as-is
      prompt = patternDescription.trim();
    }

    // Create task based on mode
    let createResponse: { error: string } | { uuid: string };

    if (mode === 'edit') {
      // Convert ImageInput array to File | string array for API
      const imageInputsForApi = selectedImageInputs.map((input) => (input.type === 'file' ? input.file : input.url));

      createResponse = await createImageEditTask({
        image_inputs: imageInputsForApi,
        image_resolution: getImageResolution(),
        image_size: getImageSizeOption(),
        max_images: count,
        prompt,
      });
    } else {
      createResponse = await createTextToImageTask({
        image_resolution: getImageResolution(),
        image_size: getImageSizeOption(),
        max_images: count,
        prompt,
      });
    }

    if ('error' in createResponse) {
      // Pass error code along with message for special handling in UI
      const errorMessage =
        'code' in createResponse && createResponse.code
          ? `${createResponse.code}:${createResponse.error}`
          : createResponse.error;

      useAiGenerateStore.setState({ errorMessage, generationStatus: 'failed' });

      return;
    }

    const { uuid } = createResponse;

    useAiGenerateStore.setState({ generationUuid: uuid });

    addPendingHistoryItem({
      count,
      dimensions,
      imageInputs: mode === 'edit' ? selectedImageInputs : undefined,
      mode,
      prompt,
      uuid,
    });

    const result = await pollTaskUntilComplete(uuid, (state) => {
      updateHistoryItem(uuid, { state });
    });

    // Update final results
    if (result.success && result.imageUrls) {
      // Update credits info first, then update store state to trigger re-render
      await getInfo({ silent: true });

      useAiGenerateStore.setState({ generatedImages: result.imageUrls, generationStatus: 'success' });
      updateHistoryItem(uuid, {
        completed_at: new Date().toISOString(),
        result_urls: result.imageUrls,
        state: 'success',
      });
    } else {
      useAiGenerateStore.setState({ errorMessage: result.error || 'Generation failed', generationStatus: 'failed' });
      updateHistoryItem(uuid, { fail_msg: result.error || 'Generation failed', state: 'fail' });
    }
  };

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

            <div className={styles.section}>
              <h3 className={styles['section-title']}>Image Dimensions</h3>
              <div className={styles['dimension-group']}>
                <Space size={8}>
                  {ALWAYS_DISPLAYED_RATIOS.map((option) => (
                    <Button
                      className={classNames(styles['dimension-button'], {
                        [styles.active]:
                          dimensions.aspectRatio === option.ratio && dimensions.orientation === option.orientation,
                      })}
                      key={option.ratio}
                      onClick={() =>
                        useAiGenerateStore.setState((state) => ({
                          dimensions: {
                            ...state.dimensions,
                            aspectRatio: option.ratio,
                            orientation: option.orientation,
                          },
                        }))
                      }
                    >
                      <div className={styles['ratio-icon']}>
                        <div
                          className={classNames(styles['ratio-box'], styles[`ratio-${option.ratio.replace(':', '-')}`])}
                        />
                      </div>
                      <span>{option.displayLabel}</span>
                    </Button>
                  ))}
                  <div
                    className={styles['more-button-container']}
                    onMouseEnter={handleMoreButtonEnter}
                    onMouseLeave={handleMoreButtonLeave}
                    ref={moreButtonRef}
                  >
                    <Button
                      className={classNames(styles['dimension-button'], {
                        [styles.active]: isAdditionalRatioSelected(),
                      })}
                    >
                      <div className={styles['ratio-icon']}>
                        <div className={classNames(styles['ratio-box'], styles['ratio-more'])} />
                      </div>
                      <span>More</span>
                    </Button>
                  </div>
                  {/* Portal menu rendered at document.body to avoid clipping */}
                  {showMoreMenu &&
                    menuPosition &&
                    createPortal(
                      <div
                        className={styles['floating-ratio-menu-portal']}
                        onMouseEnter={handleMenuEnter}
                        onMouseLeave={handleMenuLeave}
                        style={{
                          left: `${menuPosition.left}px`,
                          top: `${menuPosition.top}px`,
                        }}
                      >
                        {ADDITIONAL_RATIOS.map((option) => (
                          <div
                            className={classNames(styles['menu-item'], {
                              [styles.active]:
                                dimensions.aspectRatio === option.ratio &&
                                dimensions.orientation === option.orientation,
                            })}
                            key={`${option.ratio}-${option.orientation}`}
                            onClick={() => {
                              useAiGenerateStore.setState((state) => ({
                                dimensions: {
                                  ...state.dimensions,
                                  aspectRatio: option.ratio,
                                  orientation: option.orientation,
                                },
                              }));
                              setShowMoreMenu(false);
                              setMenuPosition(null);
                            }}
                          >
                            <div className={styles['menu-icon']}>
                              <div
                                className={classNames(
                                  styles['menu-ratio-box'],
                                  styles[`ratio-${option.orientation}-${option.ratio.replace(':', '-')}`],
                                )}
                              />
                            </div>
                            <span>{option.displayLabel}</span>
                          </div>
                        ))}
                      </div>,
                      document.body,
                    )}
                </Space>
              </div>

              <div className={styles['dimension-group']}>
                <Space size={8}>
                  {(['small', 'medium', 'large'] as ImageSize[]).map((size) => (
                    <Button
                      className={classNames(styles['size-button'], {
                        [styles.active]: dimensions.size === size,
                      })}
                      key={size}
                      onClick={() =>
                        useAiGenerateStore.setState((state) => ({ dimensions: { ...state.dimensions, size } }))
                      }
                    >
                      <span className={styles['size-name']}>{size.charAt(0).toUpperCase() + size.slice(1)}</span>
                      <span className={styles['size-pixels']}>{getSizePixels({ ...dimensions, size })}</span>
                    </Button>
                  ))}
                </Space>
              </div>
            </div>

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
