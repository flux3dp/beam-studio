import { PlusOutlined } from '@ant-design/icons';
import classNames from 'classnames';

import { mockT } from '@core/helpers/dev-helper';

import styles from './GridFile.module.scss';

interface Props {
  startNewProject: () => void;
}

const GridNew = ({ startNewProject }: Props) => {
  return (
    <div className={styles['text-container']}>
      <div className={classNames(styles['text-content'], styles.button)} onClick={startNewProject}>
        <PlusOutlined className={styles.icon} />
        <div className={styles.text}>{mockT('New Project')}</div>
      </div>
    </div>
  );
};

export default GridNew;
