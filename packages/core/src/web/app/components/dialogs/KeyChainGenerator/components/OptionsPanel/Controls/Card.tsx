import { Switch } from 'antd';

import styles from './Card.module.scss';

interface Props {
  children: React.ReactNode;
  enabled: boolean;
  onToggle?: (enabled: boolean) => void;
  title: string;
}

const Card = ({ children, enabled, onToggle, title }: Props) => {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        {title}
        <Switch checked={enabled} onChange={onToggle} />
      </div>
      {enabled && <div className={styles.content}>{children}</div>}
    </div>
  );
};

export default Card;
