import React, { useCallback, useMemo } from 'react';

import { Button, ConfigProvider, Tooltip } from 'antd';
import classNames from 'classnames';

import { ObjectPanelItem } from '@core/app/components/beambox/RightPanel/common/ObjectPanelItem';
import Divider from '@core/app/components/common/Divider';
import ListButton from '@core/app/components/common/ListButton';
import ListButtonGroup from '@core/app/components/common/ListButtonGroup';
import { textButtonTheme } from '@core/app/constants/antd-config';
import ObjectPanelIcons from '@core/app/icons/object-panel/ObjectPanelIcons';
import { useLazyData } from '@core/app/stores/element/selectedElementStore';
import { useIsTabletOrMobile } from '@core/app/stores/screenStore';
import { mockT } from '@core/helpers/is-dev';
import useI18n from '@core/helpers/useI18n';

import styles from './ActionsPanel.module.scss';
import type { ResolvedAction } from './ObjectPanel/ActionsPanel/resolve';
import { resolveAction, useActionLayout } from './ObjectPanel/ActionsPanel/resolve';

interface Props {
  elem: SVGElement;
}

const ActionsPanel = ({ elem }: Props): React.ReactNode => {
  const i18n = useI18n();
  const isTablet = useIsTabletOrMobile();
  const isVariableText = useLazyData('isVariableText');
  const hasChildVariableText = useLazyData('hasChildVariableText');
  const isFilled = useLazyData('isFilled');
  const isShading = useLazyData('isShading');

  const layoutConfig = useActionLayout();

  const renderButton = useCallback(
    (action: ResolvedAction): React.ReactNode =>
      isTablet ? (
        <Tooltip key={action.id} title={action.tooltip}>
          <ListButton
            disabled={action.disabled}
            icon={action.mobileIcon ?? action.icon}
            id={action.id}
            key={action.id}
            onClick={() => action.onClick(elem)}
          >
            {action.mobileLabel || action.label}
          </ListButton>
        </Tooltip>
      ) : (
        <Tooltip key={action.id} title={action.tooltip}>
          <div className={classNames(styles['btn-container'], { [styles.half]: !action.fullWidth })}>
            <Button
              block
              className={styles.btn}
              disabled={action.disabled}
              icon={action.icon}
              id={action.id}
              onClick={() => action.onClick(elem)}
              title={action.label}
            >
              <span className={styles.label}>{action.label}</span>
            </Button>
          </div>
        </Tooltip>
      ),
    [isTablet, elem],
  );

  const sections = useMemo(
    () =>
      layoutConfig?.map(({ actionConfigs, title }) => ({
        buttons: actionConfigs.map((config) =>
          renderButton(
            resolveAction(
              config,
              { i18n, tActionsPanel: i18n.beambox.right_panel.object_panel.actions_panel },
              { hasChildVariableText, isFilled, isShading, isVariableText },
            ),
          ),
        ),
        title,
      })),
    [layoutConfig, renderButton, i18n, hasChildVariableText, isFilled, isShading, isVariableText],
  );

  if (isTablet) {
    if (!sections) return null;

    const content = sections
      .filter((s) => s.buttons.length > 0)
      .flatMap((s, index, arr) => [...s.buttons, ...(index === arr.length - 1 ? [] : [<Divider key={index} />])]);

    return (
      <ObjectPanelItem
        icon={<ObjectPanelIcons.More />}
        id="action"
        renderContent={() => <ListButtonGroup>{content}</ListButtonGroup>}
        title={mockT('更多功能')}
      />
    );
  }

  return (
    <div className={styles.panel}>
      <ConfigProvider theme={textButtonTheme}>
        {sections
          ?.filter((s) => s.buttons.length > 0)
          .map(({ buttons, title }, index) => (
            <div className={styles.section} key={title || index}>
              {title && <div className={styles['section-title']}>{title}</div>}
              <div className={styles['btns-container']}>{buttons}</div>
            </div>
          ))}
      </ConfigProvider>
    </div>
  );
};

export default ActionsPanel;
