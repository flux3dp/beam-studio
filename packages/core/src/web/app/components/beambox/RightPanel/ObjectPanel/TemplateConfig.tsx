import React, { useMemo } from 'react';

import { SettingFilled } from '@ant-design/icons';

import Content from '@core/app/components/beambox/RightPanel/common/Content';
import Label from '@core/app/components/beambox/RightPanel/common/Label';
import { ObjectPanelItem } from '@core/app/components/beambox/RightPanel/common/ObjectPanelItem';
import Row from '@core/app/components/beambox/RightPanel/common/Row';
import Switch from '@core/app/components/beambox/RightPanel/common/Switch';
import { useSelectedElementStore } from '@core/app/stores/element/selectedElementStore';
import { useIsInteractionMode } from '@core/app/stores/interactionModeStore';
import { useIsTabletOrMobile } from '@core/app/stores/screenStore';
import { allEditableInfo, ControlType } from '@core/helpers/element/editable/base';
import { getEditableInfo } from '@core/helpers/element/editable/getter';
import { setEditableInfo, toggleEditableInfo } from '@core/helpers/element/editable/setter';
import { mockT } from '@core/helpers/is-dev';

import styles from './TemplateConfig.module.scss';

const setEditable = (editable: boolean) => {
  const { selectedElement } = useSelectedElementStore.getState();
  const newValue = editable ? allEditableInfo : {};

  setEditableInfo(selectedElement, newValue, { overwrite: true });

  useSelectedElementStore.setState({
    editableInfo: getEditableInfo(selectedElement),
  });
};

const TemplateConfig = (): React.ReactNode => {
  const isTablet = useIsTabletOrMobile();
  const isProjectMode = useIsInteractionMode('project');
  const editableInfo = useSelectedElementStore((state) => state.editableInfo);
  const controllableTypes = useSelectedElementStore((state) => state.controllableTypes);

  const { isAllEditable, isAnyEditable, isRemovable } = useMemo(() => {
    const isAnyEditable = controllableTypes.some((type) => editableInfo[type]?.value);
    const isAllEditable = controllableTypes.every((type) => editableInfo[type]?.value);
    const isRemovable = editableInfo[ControlType.DELETE]?.value ?? false;

    return { isAllEditable, isAnyEditable, isRemovable };
  }, [editableInfo, controllableTypes]);

  if (!isProjectMode) return null;

  if (isTablet) {
    return (
      <ObjectPanelItem
        icon={<SettingFilled />}
        id="template-config"
        renderContent={() => (
          <Content>
            <Row>
              <Label
                className={styles.option}
                extra={
                  <Switch
                    checked={isAnyEditable}
                    onClick={() => setEditable(!isAnyEditable)}
                    partial={isAnyEditable !== isAllEditable}
                  />
                }
              >
                {mockT('允許編輯')}
              </Label>
            </Row>
            <Row>
              <Label
                className={styles.option}
                extra={<Switch checked={isRemovable} onClick={() => toggleEditableInfo(ControlType.DELETE)} />}
              >
                {mockT('允許刪除')}
              </Label>
            </Row>
          </Content>
        )}
        title={mockT('模板控制')}
      />
    );
  }

  // TODO: desktop UI
  return null;
};

export default TemplateConfig;
