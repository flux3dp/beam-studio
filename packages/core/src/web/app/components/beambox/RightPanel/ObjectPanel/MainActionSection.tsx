import type React from 'react';
import { Fragment, memo, useRef } from 'react';

import { ButtonItem } from '@core/app/components/beambox/RightPanel/common/ObjectPanelItem';
import { useLazyData, useSelectedElementStore } from '@core/app/stores/element/selectedElementStore';
import useI18n from '@core/helpers/useI18n';

import { type ActionKey } from './ActionsPanel/actions';
import { resolveAction, useActionLayout } from './ActionsPanel/resolve';
import styles from './MainActionSection.module.scss';

const mainActionKeys: Set<ActionKey> = new Set(['weldText', 'offset', 'bgRemoval', 'imageEditPanel']);

const MainActionSection = (): React.ReactNode => {
  const i18n = useI18n();
  const tActionsPanel = i18n.beambox.right_panel.object_panel.actions_panel;
  const selectedElement = useSelectedElementStore((state) => state.selectedElement) as SVGElement;
  const isVariableText = useLazyData('isVariableText');
  const hasChildVariableText = useLazyData('hasChildVariableText');
  const isFilled = useLazyData('isFilled');
  const isShading = useLazyData('isShading');
  const activeKey = useSelectedElementStore((state) => state.activeKey);
  const ref = useRef<{ [key: string]: Element | null }>({});

  const layoutConfig = useActionLayout(mainActionKeys);

  return layoutConfig?.flatMap(({ actionConfigs }) =>
    actionConfigs.map((config) => {
      const action = resolveAction(
        config,
        { i18n, tActionsPanel },
        { hasChildVariableText, isFilled, isShading, isVariableText },
      );

      if (action.disabled) return null;

      const id = `action-${action.id}`;

      return (
        <Fragment key={action.id}>
          <ButtonItem
            className={styles.button}
            icon={action.icon}
            id={id}
            key={action.id}
            objectPanelKey={action.renderContent ? id : undefined}
            onClick={action.renderContent ? undefined : () => action.onClick(selectedElement)}
            ref={(node) => {
              ref.current[id] = node;
            }}
          />
          {action.renderContent &&
            activeKey === id &&
            action.renderContent({
              objectPanelKey: id,
              onClose: () => {},
              reference: ref.current[id],
            })}
        </Fragment>
      );
    }),
  );
};

export default memo(MainActionSection);
