import React from 'react';

import { Button, ConfigProvider, Tooltip } from 'antd';
import classNames from 'classnames';

import { useEngravableBox } from '@core/app/components/beambox/InnerEngraving/utils/engravable';
import { fitObjectsTo, moveObjectsCenterTo } from '@core/app/components/beambox/InnerEngraving/utils/groupTransform';
import { textButtonTheme } from '@core/app/constants/antd-config';
import ActionPanelIcons from '@core/app/icons/action-panel/ActionPanelIcons';
import ObjectPanelIcons from '@core/app/icons/object-panel/ObjectPanelIcons';
import { isMobile } from '@core/app/stores/screenStore';
import type { StlObject } from '@core/app/stores/stlStore';
import { useStlStore } from '@core/app/stores/stlStore';
import useI18n from '@core/helpers/useI18n';

import styles from './ActionsPanel.module.scss';
import ObjectPanelItem from './ObjectPanelItem';

interface Props {
  /** One object, or a multi-selection that is placed as a whole. */
  ids: string[];
}

/**
 * The actions panel for an STL object.
 *
 * This is stacked after the retained source type's regular `ActionsPanel`. That panel keeps the
 * familiar 2D actions visible and disables operations that cannot update a 3D object; this panel
 * adds placement actions that only make sense in the 3D scene.
 *
 * These are placement actions — moving the object into the part of the workpiece the machine can
 * actually reach. They live here rather than in ObjectPanel's tool row because the tool row
 * arranges **several** objects relative to each other (align, distribute, group, boolean), and none
 * of those apply to STL objects, while these two move the selection as a whole.
 */
const ActionsPanelStl = ({ ids }: Props): React.JSX.Element => {
  const { inner_engraving_settings: t } = useI18n();
  const box = useEngravableBox();
  // no engravable area means the safety margin has eaten the whole workpiece: nothing to aim at
  const disabled = !box.isValid;

  const withObjects = (action: (objects: StlObject[]) => void) => () => {
    const { objects } = useStlStore.getState();
    const selected = ids.map((id) => objects[id]).filter(Boolean);

    if (selected.length > 0 && box.isValid) action(selected);
  };

  const actions = [
    {
      icon: <ObjectPanelIcons.HAlignMid />,
      id: 'stl-center',
      label: t.center_on_engravable,
      onClick: withObjects((objects) => moveObjectsCenterTo(objects, box.center)),
    },
    {
      icon: <ActionPanelIcons.AutoFit />,
      id: 'stl-fit',
      label: t.fit_to_engravable,
      onClick: withObjects((objects) => fitObjectsTo(objects, box)),
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
