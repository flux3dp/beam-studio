import classNames from 'classnames';

import styles from './Row.module.scss';

// Common row styles (flex gap) for object panel popup
const Row = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return <div className={classNames(styles.row, className)}>{children}</div>;
};

export default Row;
