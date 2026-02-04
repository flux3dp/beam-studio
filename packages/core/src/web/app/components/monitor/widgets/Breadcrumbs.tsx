import type { ReactNode } from 'react';
import React, { memo, useContext } from 'react';

import { HomeOutlined } from '@ant-design/icons';
import { Breadcrumb } from 'antd';

import { MonitorContext } from '@core/app/contexts/MonitorContext';

import styles from './Breadcrumbs.module.scss';

const Breadcrumbs = (): React.JSX.Element => {
  const { currentPath, onSelectFolder } = useContext(MonitorContext);
  const breadcrumbItems: Array<{ className: string; onClick: () => void; title: ReactNode }> = [
    { className: styles.item, onClick: () => onSelectFolder('', true), title: <HomeOutlined /> },
  ];

  currentPath.forEach((folder, i) => {
    const handleClick = () => onSelectFolder(currentPath.slice(0, i + 1).join('/'), true);

    breadcrumbItems.push({ className: styles.item, onClick: handleClick, title: folder });
  });

  return <Breadcrumb className={styles.breadcrumb} items={breadcrumbItems} />;
};

export default memo(Breadcrumbs);
