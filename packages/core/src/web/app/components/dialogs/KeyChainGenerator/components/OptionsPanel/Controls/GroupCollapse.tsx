import { memo } from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Collapse, Tooltip } from 'antd';
import classNames from 'classnames';

import styles from './GroupCollapse.module.scss';

interface Props {
  children: React.ReactNode;
  collapsible?: boolean;
  title: string;
  tooltip?: string;
}

const GroupCollapse = memo(({ children, collapsible = true, title, tooltip }: Props) => {
  const header = (
    <div className={classNames(styles.header, { [styles['no-event']]: !collapsible })}>
      <div className={styles.title}>
        {title}
        {tooltip && (
          <Tooltip title={tooltip}>
            <QuestionCircleOutlined className={styles.hint} />
          </Tooltip>
        )}
      </div>
    </div>
  );

  return (
    <Collapse
      defaultActiveKey={['1']}
      expandIcon={collapsible ? undefined : () => null}
      expandIconPosition="end"
      ghost
      items={[{ children, classNames: { body: styles.content }, key: '1', label: header }]}
    />
  );
});

GroupCollapse.displayName = 'GroupCollapse';

export default GroupCollapse;
