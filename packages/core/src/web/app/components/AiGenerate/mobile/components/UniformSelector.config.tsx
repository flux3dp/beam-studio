import React from 'react';

import type { AspectRatio, ImageDimensions, ImageSize } from '../../types';
import { useAiGenerateStore } from '../../useAiGenerateStore';
import { getSizePixels } from '../../utils/dimensions';
import { ALL_RATIOS } from '../../utils/ratioOptions';

import type { SelectorOption } from './UniformSelector';
import styles from './UniformSelector.module.scss';

export const getRatioOptions = (): Array<SelectorOption<AspectRatio>> =>
  ALL_RATIOS.map(({ aspectRatio, displayLabel }) => ({
    icon: <div className={styles[`ratio-${aspectRatio.replace(':', '-')}`]} />,
    label: displayLabel,
    value: aspectRatio,
  }));

export const handleRatioSelect = (aspectRatio: AspectRatio) => {
  useAiGenerateStore.setState((s) => ({ dimensions: { ...s.dimensions, aspectRatio } }));
};

const SIZE_OPTIONS: ImageSize[] = ['1K', '2K', '4K'] as const;

export const getSizeOptions = (dimensions: ImageDimensions): Array<SelectorOption<ImageSize>> =>
  SIZE_OPTIONS.map((size) => ({ description: getSizePixels({ ...dimensions, size }), label: size, value: size }));

export const handleSizeSelect = (size: ImageSize) => {
  useAiGenerateStore.setState((s) => ({ dimensions: { ...s.dimensions, size } }));
};

const COUNT_OPTIONS = [1, 2, 3, 4] as const;

export const getCountOptions = (): Array<SelectorOption<number>> =>
  COUNT_OPTIONS.map((count) => ({ label: String(count), value: count }));

export const handleCountSelect = (count: number) => {
  useAiGenerateStore.setState({ maxImages: count });
};
