import classNames from 'classnames';

import styles from './PointIndicator.module.scss';

interface Props {
  currentIndex: number;
  onSelect?: (index: number) => void;
  points: 4 | 8;
}

const PointIndicator = ({ currentIndex, onSelect, points }: Props) => {
  return (
    <div className={styles.container}>
      {Array.from({ length: points }).map((_, index) => (
        <div
          className={classNames(styles.point, styles[`p${index}`], {
            [styles.active]: index === currentIndex,
            [styles.dot_bl]: index % 4 === 1,
            [styles.dot_br]: index % 4 === 0,
            [styles.dot_tl]: index % 4 === 3,
            [styles.dot_tr]: index % 4 === 2,
          })}
          key={index}
          onClick={() => onSelect?.(index)}
        >
          {index}
        </div>
      ))}
    </div>
  );
};

export default PointIndicator;
