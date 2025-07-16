import styles from './GridFile.module.scss';

interface Props {
  hint?: string;
  placeholder: string;
}

const GridPlaceholder = ({ hint, placeholder }: Props) => {
  return (
    <div className={styles['text-container']}>
      <div className={styles['text-content']}>
        <div className={styles.text}>{placeholder}</div>
        {hint && <div className={styles.hint}>{hint}</div>}
      </div>
    </div>
  );
};

export default GridPlaceholder;
