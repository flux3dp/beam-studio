// TODO: handle disabled reason check and tooltip

import { useMemo } from 'react';

import type { DerivedData } from '@core/app/stores/element/interface';
import { useLazyData, useSelectedElementStore } from '@core/app/stores/element/selectedElementStore';
import type { ILang } from '@core/interfaces/ILang';

import type { ActionKey, PanelAction } from './actions';
import { actions, DisabledReason } from './actions';
import type { SectionConfig } from './layout';
import { getBasicLayoutConfig } from './layout';

const ForceFullWidth: Set<ActionKey> = new Set([
  'editTextPath',
  'smartNest',
  'bgRemoval',
  'replaceWith',
  'stampMakerPanel',
  'trapezoid',
  'weldText',
  'detachPath',
  'simplify',
  'disassembleUse',
  'createTextpath',
]);

type LayoutAction = {
  fullWidth?: boolean;
  key: ActionKey;
};

export type ResolvedAction = LayoutAction &
  Omit<PanelAction, 'label' | 'mobileLabel'> & {
    disabled?: boolean;
    label: string;
    mobileLabel?: string;
    tooltip?: string;
  };

type ResolvedSectionConfig = {
  actionConfigs: LayoutAction[];
  title?: string;
};

const resolveConditionalActions = (
  layoutConfig: null | SectionConfig[],
  context: Pick<
    DerivedData,
    'canChildrenConvertToPath' | 'hasChildPathsOnly' | 'hasChildTextAndPath' | 'hasChildTextsOnly'
  >,
  { mainActionKeys }: { mainActionKeys?: Set<ActionKey> } = {},
): null | ResolvedSectionConfig[] => {
  if (!layoutConfig) return null;

  return layoutConfig.map(({ keys, title }) => {
    const actionConfigs: LayoutAction[] = [];
    let isLastPending = false;

    keys.forEach((key) => {
      if (typeof key !== 'string') {
        // Check requirement
        if (key.requirement && !context[key.requirement]) return;

        key = key.key;
      }

      if (mainActionKeys) {
        if (mainActionKeys.has(key)) actionConfigs.push({ key });
      } else {
        let shouldForceFullWidth = ForceFullWidth.has(key);

        if (shouldForceFullWidth && isLastPending) {
          // H + FF -> FF + FF
          actionConfigs.at(-1)!.fullWidth = true;
          isLastPending = false;
        } else if (!shouldForceFullWidth && isLastPending) {
          // H + H (completed row, clear pending)
          isLastPending = false;
        } else if (!shouldForceFullWidth && !isLastPending) {
          // FF + H (new row, mark pending)
          isLastPending = true;
        }

        actionConfigs.push({ fullWidth: shouldForceFullWidth, key });
      }
    });

    if (isLastPending) {
      // Fix final pending full width action
      actionConfigs.at(-1)!.fullWidth = true;
    }

    return { actionConfigs, title };
  });
};

// Handle disable and i18n
export const resolveAction = (
  layoutAction: LayoutAction,
  {
    i18n,
    tActionsPanel,
  }: { i18n: ILang; tActionsPanel: ILang['beambox']['right_panel']['object_panel']['actions_panel'] },
  context: Pick<DerivedData, 'hasChildVariableText' | 'isFilled' | 'isShading' | 'isVariableText'>,
) => {
  const originalAction = actions[layoutAction.key];
  const action: ResolvedAction = {
    ...originalAction,
    ...layoutAction,
    label: originalAction.label(i18n, tActionsPanel),
    mobileLabel: originalAction.mobileLabel?.(i18n, tActionsPanel),
  };

  if (action.disabledReasons) {
    if (action.disabledReasons.includes(DisabledReason.SHADING) && context.isShading) {
      action.disabled = true;
      action.tooltip = tActionsPanel.disabled_by_gradient;
    } else {
      let disabledByFill = false;
      let disabledByVT = false;

      if (action.disabledReasons.includes(DisabledReason.FILLED) && context.isFilled) {
        disabledByFill = true;
      }

      if (
        (action.disabledReasons.includes(DisabledReason.CHILDREN_VT) && context.hasChildVariableText) ||
        (action.disabledReasons.includes(DisabledReason.VT) && context.isVariableText)
      ) {
        disabledByVT = true;
      }

      action.disabled = disabledByFill || disabledByVT;
      action.tooltip =
        disabledByFill && disabledByVT
          ? tActionsPanel.disabled_by_infilled_and_variable_text
          : disabledByFill
            ? tActionsPanel.disabled_by_infilled
            : disabledByVT
              ? tActionsPanel.disabled_by_variable_text
              : undefined;
    }
  }

  return action;
};

export const useActionLayout = (mainActionKeys?: Set<ActionKey>) => {
  const nodeCategory = useSelectedElementStore((state) => state.nodeCategory);
  const canChildrenConvertToPath = useLazyData('canChildrenConvertToPath');
  const hasChildTextAndPath = useLazyData('hasChildTextAndPath');
  const hasChildPathsOnly = useLazyData('hasChildPathsOnly');
  const hasChildTextsOnly = useLazyData('hasChildTextsOnly');

  const basicLayoutConfig = useMemo(() => getBasicLayoutConfig(nodeCategory), [nodeCategory]);
  const layoutConfig = useMemo(
    () =>
      resolveConditionalActions(
        basicLayoutConfig,
        { canChildrenConvertToPath, hasChildPathsOnly, hasChildTextAndPath, hasChildTextsOnly },
        { mainActionKeys },
      ),
    [
      basicLayoutConfig,
      canChildrenConvertToPath,
      hasChildPathsOnly,
      hasChildTextAndPath,
      hasChildTextsOnly,
      mainActionKeys,
    ],
  );

  return layoutConfig;
};
