import { FolderOpenOutlined } from '@ant-design/icons';

import { todo } from '@core/helpers/dev-helper';

import styles from './TabRecentFiles.module.scss';

todo('TabBeamy');

const TabBeamy = () => {
  return (
    <div>
      <div className={styles.title}>
        <FolderOpenOutlined /> Beamy
      </div>
    </div>
  );
};

export default TabBeamy;
