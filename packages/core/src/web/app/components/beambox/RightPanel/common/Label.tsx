import classNames from 'classnames';

import styles from './Label.module.scss';

interface Props {
  children?: React.ReactNode;
  className?: string;
  extra?: React.ReactNode;
}

const Label = ({ children, className, extra }: Props) => {
  return (
    <div className={classNames(styles.container, className)}>
      <span className={styles.label}>{children}</span>
      {extra}
    </div>
  );
};

export default Label;
