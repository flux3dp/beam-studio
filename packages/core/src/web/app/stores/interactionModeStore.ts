import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { TEMPLATE_PREVIEW_QUERY_KEY } from '@core/app/components/dialogs/templatePreview/constants';

import { useGlobalPreferenceStore } from './globalPreferenceStore';

/** project > editor > template > explore */
export type InteractionMode = 'editor' | 'explore' | 'project' | 'template';

export const templateModes: InteractionMode[] = ['explore', 'template'] as const;

let _exploreMode = false;
let _templateMode = false;
const getInteractionMode = (
  templateCreationMode = useGlobalPreferenceStore.getState().template_creation_mode,
): InteractionMode => {
  if (!templateCreationMode) return 'editor';

  if (_templateMode) return _exploreMode ? 'explore' : 'template';

  return 'project';
};

interface InteractionModeStore {
  interactionMode: InteractionMode;
}

export const useInteractionModeStore = create(
  subscribeWithSelector<InteractionModeStore>(() => ({
    interactionMode: getInteractionMode(),
  })),
);

export const isInteractionMode = (mode: InteractionMode = 'editor') =>
  useInteractionModeStore.getState().interactionMode === mode;
export const withinInteractionModes = (modes: InteractionMode[]) =>
  modes.includes(useInteractionModeStore.getState().interactionMode);

export const useIsInteractionMode = (mode: InteractionMode = 'editor') =>
  useInteractionModeStore((state) => state.interactionMode === mode);
export const useWithinInteractionModes = (modes: InteractionMode[]) =>
  useInteractionModeStore((state) => modes.includes(state.interactionMode));

useGlobalPreferenceStore.subscribe(
  (state) => state.template_creation_mode,
  (templateCreationMode) => {
    useInteractionModeStore.setState({ interactionMode: getInteractionMode(templateCreationMode) });
  },
);
export const setTemplateMode = (templateMode: boolean) => {
  _templateMode = templateMode;
  _exploreMode = templateMode; // Directly enter explore mode when entering template mode
  useInteractionModeStore.setState({ interactionMode: getInteractionMode() });
};
export const setExploreMode = (exploreMode: boolean) => {
  _exploreMode = exploreMode;
  useInteractionModeStore.setState({ interactionMode: getInteractionMode() });
};

let count = 0;
const requiredCount = 10;
let timer: NodeJS.Timeout | null = null;
const clearCountDuration = 1000;

export const tryExitingExploreMode = () => {
  if (!_exploreMode) return;

  if (timer) clearTimeout(timer);

  timer = setTimeout(() => (count = 0), clearCountDuration);
  count += 1;

  if (count >= requiredCount) setExploreMode(false);
};

let _isTemplatePreview = false;

/** True when this window was loaded inside the template-preview iframe. */
export const getIsTemplatePreview = () => _isTemplatePreview;

/**
 * When loaded inside the template-preview iframe, the studio boots straight into template mode.
 * The flag travels in the hash query (e.g. `#/studio/beambox?templatePreview=true`). It is cleared
 * afterwards so reloads or later navigation don't re-trigger preview mode.
 */
const initTemplatePreviewFromQuery = () => {
  const { search } = window.location;
  const params = new URLSearchParams(search);

  if (params.get(TEMPLATE_PREVIEW_QUERY_KEY) !== 'true') return;

  _isTemplatePreview = true;
  setTemplateMode(true);

  params.delete(TEMPLATE_PREVIEW_QUERY_KEY);

  const newSearch = params.toString();

  window.history.replaceState(
    null,
    '',
    `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}${window.location.hash}`,
  );
};

initTemplatePreviewFromQuery();
