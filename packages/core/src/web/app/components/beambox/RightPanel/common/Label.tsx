import classNames from 'classnames';

import styles from './Label.module.scss';

interface Props {
  children?: React.ReactNode;
  className?: string;
  extra?: React.ReactNode;
  /** @deprecated */
  label?: React.ReactNode;
}

const Label = ({ children, className, extra, label }: Props) => {
  return (
    <div className={classNames(styles.container, className)}>
      <span className={styles.label}>
        {label}
        {children}
      </span>
      {extra}
    </div>
  );
};

export default Label;
