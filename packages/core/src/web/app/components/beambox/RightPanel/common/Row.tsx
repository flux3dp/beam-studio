import classNames from 'classnames';

import styles from './Row.module.scss';

const Row = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return <div className={classNames(styles.row, className)}>{children}</div>;
};

export default Row;
