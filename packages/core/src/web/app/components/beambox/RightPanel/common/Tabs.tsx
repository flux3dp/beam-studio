import type { TabsProps } from 'antd';
import { Tabs as AntdTabs } from 'antd';
import classNames from 'classnames';

import styles from './Tabs.module.scss';

type Props = Pick<TabsProps, 'className' | 'items' | 'onChange'>;

// Styles for nested tabs & tab labels with pure icons
// Set defaultActiveKey to first visible tab
const Tabs = ({ className, items, onChange }: Props) => {
  if (!items?.length) return null;

  return (
    <AntdTabs
      centered
      className={classNames(className, styles.tabs)}
      defaultActiveKey={items[0].key}
      destroyInactiveTabPane
      items={items}
      onChange={onChange}
      size="small"
    />
  );
};

export default Tabs;
