import type { ReactNode } from 'react';
import React, { memo, useState } from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Collapse, Switch, Tooltip } from 'antd';

import styles from './GroupControl.module.scss';

interface GroupControlProps {
  children: React.ReactNode;
  enabled: boolean;
  hideSwitch?: boolean;
  id?: string;
  onToggle?: (enabled: boolean) => void;
  title: string;
  tooltip?: string;
}

const GroupControl = ({
  children,
  enabled,
  hideSwitch = false,
  id = '1',
  onToggle,
  title,
  tooltip,
}: GroupControlProps): ReactNode => {
  const [expandedKeys, setExpandedKeys] = useState<string[]>(enabled ? [id] : []);

  const handleToggle = (checked: boolean) => {
    setExpandedKeys(checked ? [id] : []);
    onToggle?.(checked);
  };

  const header = (
    <div className={styles.header}>
      <div className={styles.title}>
        {title}
        {tooltip && (
          <Tooltip title={tooltip}>
            <QuestionCircleOutlined className={styles.hint} />
          </Tooltip>
        )}
      </div>
      {!hideSwitch && (
        <Switch checked={enabled} onChange={handleToggle} onClick={(_, e) => e.stopPropagation()} size="small" />
      )}
    </div>
  );

  return (
    <Collapse
      activeKey={enabled ? expandedKeys : []}
      collapsible={enabled ? undefined : 'disabled'}
      ghost
      items={[{ children, classNames: { body: styles.content }, key: id, label: header }]}
      onChange={(keys) => setExpandedKeys(keys as string[])}
    />
  );
};

GroupControl.displayName = 'GroupControl';

export default memo(GroupControl);
