import React, { memo, useMemo } from 'react';

import { BulbOutlined, CloseOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Input, Select, Space } from 'antd';
import classNames from 'classnames';
import { match } from 'ts-pattern';

import FluxIcons from '@core/app/icons/flux/FluxIcons';
import type { ImageResolution, ImageSizeOption, TextToImageRequest } from '@core/helpers/api/ai-image';
import { createTextToImageTask, pollTaskUntilComplete } from '@core/helpers/api/ai-image';
import { getCurrentUser } from '@core/helpers/api/flux-id';

import styles from './index.module.scss';
import type { AspectRatio, ImageSize } from './useAiGenerateStore';
import { useAiGenerateStore } from './useAiGenerateStore';

const { TextArea } = Input;

const UnmemorizedAiGenerate = () => {
  const currentUser = getCurrentUser();
  const { info } = currentUser || { info: null };
  const { clearGenerationResults, count, dimensions, patternDescription, resetForm, textToDisplay } =
    useAiGenerateStore();

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
      useAiGenerateStore.setState({ errorMessage: 'Please provide a pattern description' });

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

    // Combine pattern description and text to display into single prompt
    let prompt = patternDescription.trim();

    if (textToDisplay.trim()) {
      prompt += `\n\nText to display: "${textToDisplay.trim()}"`;
    }

    const request: TextToImageRequest = {
      image_resolution: getImageResolution(),
      image_size: getImageSizeOption(),
      max_images: count,
      prompt,
    };

    // Create task
    const createResponse = await createTextToImageTask(request);

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
        <div className={styles.section}>
          <h3 className={styles['section-title']}>Choose Style</h3>
          <div className={styles['style-card']}>
            <div className={styles['style-preview']}>
              <img alt="Logo preview" className={styles['style-image']} src="https://picsum.photos/60" />
            </div>
            <span className={styles['style-name']}>Logo with Text</span>
            <span className={styles['style-arrow']}>›</span>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles['section-title']}>Pattern description</h3>
          <div className={styles['input-wrapper']}>
            <TextArea
              className={styles.textarea}
              maxLength={300}
              onChange={(e) => useAiGenerateStore.setState({ patternDescription: e.target.value })}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Please describe the logo pattern you would like to create."
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
            options={[
              { label: '1', value: 1 },
              { label: '2', value: 2 },
              { label: '3', value: 3 },
              { label: '4', value: 4 },
            ]}
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
      </div>
    </div>
  );
};

const AiGenerate = memo(UnmemorizedAiGenerate, () => true);

export default AiGenerate;
