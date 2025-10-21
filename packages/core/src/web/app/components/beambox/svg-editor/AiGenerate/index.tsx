import React, { memo, useMemo } from 'react';

import { BulbOutlined, ClockCircleOutlined, CloseOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Input, Select, Space } from 'antd';
import classNames from 'classnames';
import { match } from 'ts-pattern';

import FluxIcons from '@core/app/icons/flux/FluxIcons';
import type { ImageResolution, ImageSizeOption } from '@core/helpers/api/ai-image';
import { createImageEditTask, createTextToImageTask, pollTaskUntilComplete } from '@core/helpers/api/ai-image';
import { getCurrentUser } from '@core/helpers/api/flux-id';

import ImageHistory from './ImageHistory';
import ImageResults from './ImageResults';
import ImageUploadArea from './ImageUploadArea';
import styles from './index.module.scss';
import type { AspectRatio, ImageSize } from './useAiGenerateStore';
import { useAiGenerateStore } from './useAiGenerateStore';

const { TextArea } = Input;

const UnmemorizedAiGenerate = () => {
  const currentUser = getCurrentUser();
  const { info } = currentUser || { info: null };
  const {
    addSelectedImage,
    clearGenerationResults,
    count,
    dimensions,
    errorMessage,
    generatedImages,
    generationStatus,
    mode,
    patternDescription,
    removeSelectedImage,
    removeSelectedImageUrl,
    resetForm,
    selectedImages,
    selectedImageUrls,
    setMode,
    showHistory,
    textToDisplay,
    toggleHistory,
  } = useAiGenerateStore();

  const getSizePixels = (size: ImageSize): string =>
    match(size)
      .with('small', () => '1024 x 1024')
      .with('medium', () => '2048 x 2048')
      .with('large', () => '4096 x 4096')
      .exhaustive();

  const creditsRequired = useMemo(
    () =>
      match(dimensions.size)
        .with('small', () => 10)
        .with('medium', () => 15)
        .with('large', () => 20)
        .exhaustive() * count,
    [dimensions.size, count],
  );

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

  const handleGenerate = async () => {
    if (!patternDescription.trim()) {
      useAiGenerateStore.setState({ errorMessage: 'Please provide a prompt description' });

      return;
    }

    // Validate edit mode requirements
    const totalImages = selectedImages.length + selectedImageUrls.length;

    if (mode === 'edit' && totalImages === 0) {
      useAiGenerateStore.setState({ errorMessage: 'Please upload at least one image for editing' });

      return;
    }

    if (mode === 'edit' && totalImages > 10) {
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
    let prompt = patternDescription.trim();

    // Add text overlay only in text-to-image mode
    if (mode === 'text-to-image' && textToDisplay.trim()) {
      prompt += `\n\nText to display: "${textToDisplay.trim()}"`;
    }

    // Create task based on mode
    let createResponse: { error: string } | { uuid: string };

    if (mode === 'edit') {
      createResponse = await createImageEditTask({
        image_resolution: getImageResolution(),
        image_size: getImageSizeOption(),
        imageFiles: selectedImages.length > 0 ? selectedImages : undefined,
        imageUrls: selectedImageUrls.length > 0 ? selectedImageUrls : undefined,
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
      useAiGenerateStore.setState({ errorMessage: createResponse.error, generationStatus: 'failed' });

      return;
    }

    // Poll for results using UUID
    const { uuid } = createResponse;

    useAiGenerateStore.setState({ generationUuid: uuid });

    const result = await pollTaskUntilComplete(uuid);

    if (result.success && result.imageUrls) {
      useAiGenerateStore.setState({ generatedImages: result.imageUrls, generationStatus: 'success' });
    } else {
      useAiGenerateStore.setState({ errorMessage: result.error || 'Generation failed', generationStatus: 'failed' });
    }
  };

  const handleClose = () => {
    useAiGenerateStore.setState({ isAiGenerateShown: false });
  };

  const handleRefresh = () => {
    resetForm();
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
              <h3 className={styles['section-title']}>Mode</h3>
              <Space size={8}>
                <Button
                  className={classNames(styles['mode-button'], {
                    [styles.active]: mode === 'text-to-image',
                  })}
                  onClick={() => setMode('text-to-image')}
                  size="large"
                >
                  Text to Image
                </Button>
                <Button
                  className={classNames(styles['mode-button'], {
                    [styles.active]: mode === 'edit',
                  })}
                  onClick={() => setMode('edit')}
                  size="large"
                >
                  Edit Image
                </Button>
              </Space>
            </div>

            {mode === 'edit' && (
              <div className={styles.section}>
                <h3 className={styles['section-title']}>Upload Images</h3>
                <ImageUploadArea
                  images={selectedImages}
                  imageUrls={selectedImageUrls}
                  onAdd={addSelectedImage}
                  onRemove={removeSelectedImage}
                  onRemoveUrl={removeSelectedImageUrl}
                />
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
                    mode === 'edit'
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
              </div>
            </div>

            {mode === 'text-to-image' && (
              <div className={styles.section}>
                <h3 className={styles['section-title']}>Text to display</h3>
                <div className={styles['input-wrapper']}>
                  <TextArea
                    className={styles.textarea}
                    maxLength={15}
                    onChange={(e) => useAiGenerateStore.setState({ textToDisplay: e.target.value })}
                    onKeyDown={(e) => e.stopPropagation()}
                    placeholder="Please ether the text you would like to display."
                    rows={3}
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
                    value={textToDisplay}
                  />
                </div>
              </div>
            )}

            <div className={styles.section}>
              <h3 className={styles['section-title']}>Image Dimensions</h3>

              <div className={styles['dimension-group']}>
                <Space size={8}>
                  {(['1:1', '4:3', '16:9'] as AspectRatio[]).map((ratio) => (
                    <Button
                      className={classNames(styles['dimension-button'], {
                        [styles.active]: dimensions.aspectRatio === ratio,
                      })}
                      key={ratio}
                      onClick={() =>
                        useAiGenerateStore.setState((state) => ({
                          dimensions: { ...state.dimensions, aspectRatio: ratio },
                        }))
                      }
                    >
                      <div className={styles['ratio-icon']}>
                        <div className={classNames(styles['ratio-box'], styles[`ratio-${ratio.replace(':', '-')}`])} />
                      </div>
                      <span>{ratio}</span>
                    </Button>
                  ))}
                  <Button
                    className={classNames(styles['dimension-button'], {
                      [styles.active]: dimensions.aspectRatio === 'custom',
                    })}
                    onClick={() =>
                      useAiGenerateStore.setState((state) => ({
                        dimensions: { ...state.dimensions, aspectRatio: 'custom' },
                      }))
                    }
                  >
                    <div className={styles['ratio-icon']}>
                      <div className={classNames(styles['ratio-box'], styles['ratio-custom'])} />
                    </div>
                    <span>More</span>
                  </Button>
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
                      <span className={styles['size-pixels']}>{getSizePixels(size)}</span>
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
                options={[1, 2, 3, 4, 5, 6].map((num) => ({ label: String(num), value: num }))}
                value={count}
              />
            </div>

            <div className={styles['button-section']}>
              <Button block className={styles['generate-button']} onClick={handleGenerate} size="large" type="primary">
                Generate
              </Button>

              <div className={styles['credits-info']}>
                <span className={styles['credits-required']}>Credit required {creditsRequired}</span>
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

const AiGenerate = memo(UnmemorizedAiGenerate, () => true);

export default AiGenerate;
