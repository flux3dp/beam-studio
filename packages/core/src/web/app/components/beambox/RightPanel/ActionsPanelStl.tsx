import React from 'react';

import { CodeSandboxOutlined } from '@ant-design/icons';
import { Button, ConfigProvider, Tooltip } from 'antd';
import classNames from 'classnames';

import { useEngravableBox } from '@core/app/components/beambox/InnerEngraving/utils/engravable';
import { fitObjectsTo, moveObjectsCenterTo } from '@core/app/components/beambox/InnerEngraving/utils/groupTransform';
import { showPhotoTo3dModal } from '@core/app/components/dialogs/PhotoTo3dModal';
import { textButtonTheme } from '@core/app/constants/antd-config';
import ActionPanelIcons from '@core/app/icons/action-panel/ActionPanelIcons';
import ObjectPanelIcons from '@core/app/icons/object-panel/ObjectPanelIcons';
import { isMobile } from '@core/app/stores/screenStore';
import type { StlObject } from '@core/app/stores/stlStore';
import { useStlStore } from '@core/app/stores/stlStore';
import { isPhotoPlaneProjection } from '@core/app/svgedit/stl/getters';
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
  // a single photo plane that is still flat can be turned into a point cloud from its depth
  const isFlatPhoto = useStlStore((state) => ids.length === 1 && state.objects[ids[0]]?.kind === 'photo');
  const photo = isFlatPhoto ? document.getElementById(ids[0]) : null;

  const withObjects = (action: (objects: StlObject[]) => void) => () => {
    const { objects } = useStlStore.getState();
    const selected = ids.map((id) => objects[id]).filter(Boolean);

    if (selected.length > 0 && box.isValid) action(selected);
  };

  const actions: Array<{
    alwaysEnabled?: boolean;
    icon: React.JSX.Element;
    id: string;
    label: string;
    onClick: () => void;
  }> = [
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
    ...(photo && isPhotoPlaneProjection(photo)
      ? [
          {
            // not a placement: the engravable area does not matter
            alwaysEnabled: true,
            icon: <CodeSandboxOutlined />,
            id: 'stl-photo-to-3d',
            label: t.photo_to_3d,
            onClick: () => showPhotoTo3dModal(photo as unknown as SVGImageElement),
          },
        ]
      : []),
  ];

  if (isMobile()) {
    return (
      <div className={styles.container}>
        <ObjectPanelItem.Divider />
        {actions.map(({ alwaysEnabled, icon, id: actionId, label, onClick }) => (
          <ObjectPanelItem.Item
            content={icon}
            disabled={disabled && !alwaysEnabled}
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
            {actions.map(({ alwaysEnabled, icon, id: actionId, label, onClick }) => (
              <Tooltip key={actionId} title={disabled && !alwaysEnabled ? t.no_engravable_area : undefined}>
                <div className={classNames(styles['btn-container'])}>
                  <Button
                    block
                    className={styles.btn}
                    disabled={disabled && !alwaysEnabled}
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
