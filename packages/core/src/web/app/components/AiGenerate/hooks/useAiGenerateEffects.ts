/**
 * useAiGenerateEffects - Manages side effects for AiGenerate components.
 *
 * This hook is designed to be used alongside useAiGenerateStore() and useAiConfigQuery().
 * It provides:
 * - Side effects (scroll handling, style initialization)
 * - Computed values (showFooter)
 * - Actions (onGenerate)
 */
import { useCallback, useEffect, useMemo } from 'react';

import { funnel } from 'remeda';

import { GENERATE_BUTTON_COOLDOWN_MS } from '../types';
import { useAiGenerateStore } from '../useAiGenerateStore';
import { getDefaultStyle } from '../utils/categories';
import { handleImageGeneration } from '../utils/handleImageGeneration';

import { useAiConfigQuery } from './useAiConfigQuery';

interface ScrollTarget {
  scrollTo: (options: { behavior?: 'auto' | 'smooth'; top?: number }) => void;
}

interface UseAiGenerateEffectsOptions {
  scrollTarget?: null | ScrollTarget;
}

export const useAiGenerateEffects = ({ scrollTarget }: UseAiGenerateEffectsOptions = {}) => {
  const {
    hasInitializedStyle,
    isGenerateDisabled,
    markStyleInitialized,
    scrollTarget: storeScrollTarget,
    scrollTrigger,
    setGenerateDisabled,
    setStyle,
    showHistory,
    styleId,
    triggerScroll,
    user,
  } = useAiGenerateStore();
  const {
    data: { categories, styles },
    isError,
    isFetching,
  } = useAiConfigQuery();
  const showFooter = !isFetching && !isError && !showHistory;

  // Auto-select default style (only once per session)
  useEffect(() => {
    if (hasInitializedStyle || styles.length === 1) return;

    const defaultStyle = getDefaultStyle(styles, categories);

    if (defaultStyle && defaultStyle?.id !== 'customize') {
      setStyle(defaultStyle.id, styles);
      markStyleInitialized();
    }
  }, [hasInitializedStyle, styles, categories, setStyle, markStyleInitialized]);

  // Scroll trigger
  useEffect(() => {
    if (scrollTrigger === 0 || !scrollTarget) return;

    requestAnimationFrame(() => {
      const top = storeScrollTarget === 'top' ? 0 : 1000;

      scrollTarget.scrollTo({ behavior: 'smooth', top });
    });
  }, [scrollTrigger, storeScrollTarget, scrollTarget]);

  // Throttled generate action
  const throttledGenerate = useMemo(
    () =>
      funnel(
        () => {
          setGenerateDisabled(true);
          handleImageGeneration({ style: styleId, styles, user });
          triggerScroll('bottom');
          setTimeout(() => setGenerateDisabled(false), GENERATE_BUTTON_COOLDOWN_MS);
        },
        { minGapMs: GENERATE_BUTTON_COOLDOWN_MS, triggerAt: 'start' },
      ),
    [styleId, styles, user, triggerScroll, setGenerateDisabled],
  );

  const onGenerate = useCallback(() => throttledGenerate.call(), [throttledGenerate]);

  return { isGenerateDisabled, onGenerate, showFooter };
};
