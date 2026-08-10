import React from 'react';

import { Button, ConfigProvider, Tooltip } from 'antd';
import classNames from 'classnames';

import { useEngravableBox } from '@core/app/components/beambox/InnerEngraving/utils/engravable';
import { fitObjectTo, moveObjectCenterTo } from '@core/app/components/beambox/InnerEngraving/utils/transform';
import { textButtonTheme } from '@core/app/constants/antd-config';
import ActionPanelIcons from '@core/app/icons/action-panel/ActionPanelIcons';
import ObjectPanelIcons from '@core/app/icons/object-panel/ObjectPanelIcons';
import { isMobile } from '@core/app/stores/screenStore';
import type { StlObject } from '@core/app/stores/stlStore';
import { useStlStore } from '@core/app/stores/stlStore';
import { todo } from '@core/helpers/is-dev';
import useI18n from '@core/helpers/useI18n';

import styles from './ActionsPanel.module.scss';
import ObjectPanelItem from './ObjectPanelItem';

todo('Add icons');

interface Props {
  id: string;
}

/**
 * The actions panel for an STL object.
 *
 * Deliberately shares nothing with the 2D `ActionsPanel`: every action there (trace, offset, weld,
 * convert to path, ...) is a vector operation with no 3D meaning, so this is a separate component
 * rather than another branch in that file's dispatch.
 *
 * What is left is placement — moving the object into the part of the workpiece the machine can
 * actually reach. That is why these live here rather than in ObjectPanel's tool row: the tool row
 * arranges **several** objects relative to each other (align, distribute, group, boolean), and none
 * of those apply to STL objects, while these two act on the one selected object.
 */
const ActionsPanelStl = ({ id }: Props): React.JSX.Element => {
  const { inner_engraving_settings: t } = useI18n();
  const box = useEngravableBox();
  // no engravable area means the safety margin has eaten the whole workpiece: nothing to aim at
  const disabled = !box.isValid;

  const withObject = (action: (object: StlObject) => void) => () => {
    const object = useStlStore.getState().objects[id];

    if (object && box.isValid) action(object);
  };

  const actions = [
    {
      icon: <ObjectPanelIcons.HAlignMid />,
      id: 'stl-center',
      label: t.center_on_engravable,
      onClick: withObject((object) => moveObjectCenterTo(object, box.center)),
    },
    {
      icon: <ActionPanelIcons.AutoFit />,
      id: 'stl-fit',
      label: t.fit_to_engravable,
      onClick: withObject((object) => fitObjectTo(object, box)),
    },
  ];

  if (isMobile()) {
    return (
      <div className={styles.container}>
        <ObjectPanelItem.Divider />
        {actions.map(({ icon, id: actionId, label, onClick }) => (
          <ObjectPanelItem.Item
            content={icon}
            disabled={disabled}
            id={actionId}
            key={actionId}
            label={label}
            onClick={onClick}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <ConfigProvider theme={textButtonTheme}>
        <div className={styles.section}>
          <div className={styles['section-title']}>ACTIONS</div>
          <div className={styles['btns-container']}>
            {actions.map(({ icon, id: actionId, label, onClick }) => (
              <Tooltip key={actionId} title={disabled ? t.no_engravable_area : undefined}>
                <div className={classNames(styles['btn-container'])}>
                  <Button
                    block
                    className={styles.btn}
                    disabled={disabled}
                    icon={icon}
                    id={actionId}
                    onClick={onClick}
                    title={label}
                  >
                    <span className={styles.label}>{label}</span>
                  </Button>
                </div>
              </Tooltip>
            ))}
          </div>
        </div>
      </ConfigProvider>
    </div>
  );
};

export default ActionsPanelStl;
