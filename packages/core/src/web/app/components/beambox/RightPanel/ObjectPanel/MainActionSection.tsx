import type React from 'react';
import { memo } from 'react';

import { ButtonItem } from '@core/app/components/beambox/RightPanel/common/ObjectPanelItem';
import { useLazyData, useSelectedElementStore } from '@core/app/stores/element/selectedElementStore';
import useI18n from '@core/helpers/useI18n';

import { type ActionKey } from './ActionsPanel/actions';
import { resolveAction, useActionLayout } from './ActionsPanel/resolve';

const mainActionKeys: Set<ActionKey> = new Set(['weldText', 'offset', 'bgRemoval', 'imageEditPanel']);

const MainActionSection = (): React.ReactNode => {
  const i18n = useI18n();
  const tActionsPanel = i18n.beambox.right_panel.object_panel.actions_panel;
  const selectedElement = useSelectedElementStore((state) => state.selectedElement) as SVGElement;
  const isVariableText = useLazyData('isVariableText');
  const hasChildVariableText = useLazyData('hasChildVariableText');
  const isFilled = useLazyData('isFilled');
  const isShading = useLazyData('isShading');

  const layoutConfig = useActionLayout(mainActionKeys);

  return layoutConfig?.flatMap(({ actionConfigs }) =>
    actionConfigs.map((config) => {
      const action = resolveAction(
        config,
        { i18n, tActionsPanel },
        { hasChildVariableText, isFilled, isShading, isVariableText },
      );

      return action.disabled ? null : (
        <ButtonItem
          icon={action.mainIcon ?? action.mobileIcon ?? action.icon}
          id={action.id}
          key={action.id}
          onClick={() => action.onClick(selectedElement)}
        />
      );
    }),
  );
};

export default memo(MainActionSection);
