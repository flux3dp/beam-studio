import { shallow } from 'zustand/shallow';

import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import { useCurveEngravingStore } from '@core/app/stores/curveEngravingStore';
import { changeMultipleDocumentStoreValues, useDocumentStore } from '@core/app/stores/documentStore';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type { DocumentState } from '@core/interfaces/Preference';

import { checkAutoFeeder, disableAutoFeeder, enableAutoFeeder, getAutoFeeder } from './addOn/autoFeeder';
import {
  checkCurveEngraving,
  disableCurveEngraving,
  enableCurveEngraving,
  getCurveEngraving,
} from './addOn/curveEngraving';
import {
  checkInnerEngraving,
  disableInnerEngraving,
  enableInnerEngraving,
  getInnerEngraving,
} from './addOn/innerEngraving';
import { checkPassThrough, disablePassThrough, enablePassThrough, getPassThrough } from './addOn/passThrough';
import { checkRotary, disableRotary, enableRotary, getRotary } from './addOn/rotary';
import type { AddOnModeContext, AddOnModeMutationOptions } from './addOn/types';

/** Modes that redefine the document coordinate space and therefore cannot be combined. */
export type ExclusiveMode = 'auto-feeder' | 'curve-engraving' | 'inner-engraving' | 'pass-through' | 'rotary';

type ExclusiveModeHandler = {
  check: (context: AddOnModeContext) => boolean;
  disable: (options: AddOnModeMutationOptions) => void;
  enable: (options: AddOnModeMutationOptions) => void;
  get: (context: AddOnModeContext) => boolean;
};

const handlers = {
  'auto-feeder': {
    check: checkAutoFeeder,
    disable: disableAutoFeeder,
    enable: enableAutoFeeder,
    get: getAutoFeeder,
  },
  'curve-engraving': {
    check: checkCurveEngraving,
    disable: disableCurveEngraving,
    enable: enableCurveEngraving,
    get: getCurveEngraving,
  },
  'inner-engraving': {
    check: checkInnerEngraving,
    disable: disableInnerEngraving,
    enable: enableInnerEngraving,
    get: getInnerEngraving,
  },
  'pass-through': {
    check: checkPassThrough,
    disable: disablePassThrough,
    enable: enablePassThrough,
    get: getPassThrough,
  },
  rotary: {
    check: checkRotary,
    disable: disableRotary,
    enable: enableRotary,
    get: getRotary,
  },
} satisfies Record<ExclusiveMode, ExclusiveModeHandler>;

export const EXCLUSIVE_MODES = Object.keys(handlers) as ExclusiveMode[];

export const checkExclusiveMode = (mode: ExclusiveMode, context: AddOnModeContext = {}): boolean =>
  handlers[mode].check(context);

export const getExclusiveMode = (mode: ExclusiveMode, context: AddOnModeContext = {}): boolean =>
  handlers[mode].get(context);

export const checkSupportMode = (context: AddOnModeContext = {}): Record<ExclusiveMode, boolean> =>
  Object.fromEntries(EXCLUSIVE_MODES.map((mode) => [mode, checkExclusiveMode(mode, context)])) as Record<
    ExclusiveMode,
    boolean
  >;

/** The effective active mode after applying machine/add-on capability checks. */
export const getActiveExclusiveMode = (context: AddOnModeContext = {}): ExclusiveMode | null => {
  // Keep document modes ahead of curve engraving so malformed legacy documents normalize
  // deterministically when more than one flag is present.
  const priority: ExclusiveMode[] = ['inner-engraving', 'rotary', 'pass-through', 'auto-feeder', 'curve-engraving'];

  return priority.find((mode) => getExclusiveMode(mode, context)) ?? null;
};

export interface SetExclusiveModeOptions extends AddOnModeContext {
  applyRuntime?: boolean;
  parentCmd?: IBatchCommand;
  update?: (values: Partial<DocumentState>) => void;
}

/**
 * Force an exclusive mode state onto the live document (or a supplied updater).
 * Enabling one mode disables every other mode through its own helper, including runtime cleanup.
 */
export const setExclusiveMode = (
  mode: ExclusiveMode,
  enabled: boolean,
  { applyRuntime = true, parentCmd, update, ...context }: SetExclusiveModeOptions = {},
): boolean => {
  if (enabled && !checkExclusiveMode(mode, context)) return false;

  const patch: Partial<DocumentState> = {};
  const mutationOptions: AddOnModeMutationOptions = {
    applyRuntime,
    promarkInfo: context.promarkInfo ?? undefined,
    update: (values) => Object.assign(patch, values),
  };

  if (enabled) {
    for (const otherMode of EXCLUSIVE_MODES) {
      if (otherMode !== mode) handlers[otherMode].disable(mutationOptions);
    }

    handlers[mode].enable(mutationOptions);
  } else {
    handlers[mode].disable(mutationOptions);
  }

  if (Object.keys(patch).length > 0) {
    if (update) update(patch);
    else changeMultipleDocumentStoreValues(patch, { parentCmd });
  }

  return true;
};

/**
 * Apply exclusivity to a draft/command patch without mutating the live document store.
 * Runtime cleanup is opt-in for import flows that replace the current document.
 */
export const applyExclusiveModePatch = (
  patch: Partial<DocumentState>,
  mode: ExclusiveMode,
  enabled: boolean,
  options: Omit<SetExclusiveModeOptions, 'parentCmd' | 'update'> = {},
): boolean =>
  setExclusiveMode(mode, enabled, {
    ...options,
    applyRuntime: options.applyRuntime ?? false,
    update: (values) => Object.assign(patch, values),
    values: { ...options.values, ...patch },
  });

/** Whether a mode is supported and does not conflict with the current effective mode. */
export const canEnableExclusiveMode = (mode: ExclusiveMode, context: AddOnModeContext = {}): boolean => {
  if (!checkExclusiveMode(mode, context)) return false;

  const activeMode = getActiveExclusiveMode(context);

  return activeMode === null || activeMode === mode;
};

export const canStartCurveEngraving = (): boolean => canEnableExclusiveMode('curve-engraving');

/** Centralized subscriptions for native-menu and other imperative mode gates. */
export const subscribeExclusiveModeGate = (
  mode: ExclusiveMode,
  listener: (canEnable: boolean) => void,
): (() => void) => {
  const notify = () => listener(canEnableExclusiveMode(mode));
  const unsubscribeDocument = useDocumentStore.subscribe(
    (state) => [
      state.workarea,
      state.borderless,
      state.rotary_mode,
      state['auto-feeder'],
      state['pass-through'],
      state['inner-engraving'],
    ],
    notify,
    { equalityFn: shallow },
  );
  const unsubscribeCanvas = useCanvasStore.subscribe((state) => state.mode, notify);
  const unsubscribeCurve = useCurveEngravingStore.subscribe((state) => state.hasData, notify);

  return () => {
    unsubscribeDocument();
    unsubscribeCanvas();
    unsubscribeCurve();
  };
};
