// Use Antd Tabs
// With additional visible flag
// defaultActiveKey always set to first tab(need to check visible)
// Wrap label with custom style

import type { TabsProps } from 'antd';
import { Tabs as AntdTabs } from 'antd';
import classNames from 'classnames';

import styles from './Tabs.module.scss';

type Props = Pick<TabsProps, 'className' | 'items' | 'onChange'> & {
  /** @deprecated */
  hiddenItem?: Record<string, boolean>;
};

const Tabs = ({ className, hiddenItem, items, onChange }: Props) => {
  const visibleItems = items?.filter((item) => !hiddenItem?.[item.key]);

  if (!visibleItems?.length) return null;

  const defaultActiveKey = visibleItems[0].key;

  return (
    <AntdTabs
      centered
      className={classNames(className, styles.tabs)}
      defaultActiveKey={defaultActiveKey}
      destroyInactiveTabPane
      items={visibleItems}
      onChange={onChange}
      size="small"
    />
  );
};

export default Tabs;
