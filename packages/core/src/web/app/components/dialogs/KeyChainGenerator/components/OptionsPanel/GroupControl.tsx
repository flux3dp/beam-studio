import type { ReactNode } from 'react';
import React, { memo, useState } from 'react';

import { Collapse, Switch } from 'antd';

import styles from './GroupControl.module.scss';

interface GroupControlProps {
  children: React.ReactNode;
  enabled: boolean;
  id: string;
  onToggle: (enabled: boolean) => void;
  title: string;
}

const GroupControl = ({ children, enabled, id, onToggle, title }: GroupControlProps): ReactNode => {
  const [expandedKeys, setExpandedKeys] = useState<string[]>(enabled ? [id] : []);

  const handleToggle = (checked: boolean) => {
    setExpandedKeys(checked ? [id] : []);
    onToggle(checked);
  };

  const header = (
    <div className={styles.header}>
      <div className={styles.title}>{title}</div>
      <Switch checked={enabled} onChange={handleToggle} onClick={(_, e) => e.stopPropagation()} size="small" />
    </div>
  );

  return (
    <Collapse
      activeKey={enabled ? expandedKeys : []}
      className={styles.container}
      collapsible={enabled ? undefined : 'disabled'}
      items={[{ children, key: id, label: header }]}
      onChange={(keys) => setExpandedKeys(keys as string[])}
    />
  );
};

GroupControl.displayName = 'GroupControl';

export default memo(GroupControl);
