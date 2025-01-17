import React, { memo, ReactNode, useContext } from 'react';
import { Breadcrumb } from 'antd';
import { HomeOutlined } from '@ant-design/icons';

import { MonitorContext } from 'app/contexts/MonitorContext';

import styles from './Breadcrumbs.module.scss';

const Breadcrumbs = (): JSX.Element => {
  const { currentPath, onSelectFolder } = useContext(MonitorContext);
  const breadcrumbItems: { title: ReactNode; onClick: () => void; className: string; }[] = [
    { title: <HomeOutlined />, onClick: () => onSelectFolder('', true), className: styles.item }
  ];
  currentPath.forEach((folder, i) => {
    const handleClick = () => onSelectFolder(currentPath.slice(0, i + 1).join('/'), true);
    breadcrumbItems.push({ title: folder, onClick: handleClick, className: styles.item });
  });

  return <Breadcrumb className={styles.breadcrumb} items={breadcrumbItems} />;
};

export default memo(Breadcrumbs);
