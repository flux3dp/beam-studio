import React from 'react';

import styles from './SettingsCard.module.scss';

interface SettingsCardProps {
  children: React.ReactNode;
  title?: string;
}

const SettingsCard = ({ children, title }: SettingsCardProps): React.JSX.Element => (
  <div className={styles.card}>
    {title && <div className={styles['card-title']}>{title}</div>}
    {children}
  </div>
);

export default SettingsCard;
