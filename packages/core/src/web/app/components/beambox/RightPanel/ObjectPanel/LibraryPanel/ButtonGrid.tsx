import classNames from 'classnames';

import styles from './ContentGrid.module.scss';

interface Props {
  icon: React.ReactNode;
  onClick: () => void;
}

const ButtonGrid = ({ icon, onClick }: Props) => {
  return (
    <div className={classNames(styles.container, styles.button)} onClick={onClick}>
      {icon}
    </div>
  );
};

export default ButtonGrid;
