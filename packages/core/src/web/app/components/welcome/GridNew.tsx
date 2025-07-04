import { PlusOutlined } from '@ant-design/icons';
import classNames from 'classnames';

import styles from './GridFile.module.scss';

const GridNew = () => {
  return (
    <div className={classNames(styles['text-container'], styles.button)}>
      <PlusOutlined className={styles.icon} />
      <div className={styles.text}>New Project</div>
    </div>
  );
};

export default GridNew;
