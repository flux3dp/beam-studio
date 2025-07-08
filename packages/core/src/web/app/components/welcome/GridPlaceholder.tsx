import styles from './GridFile.module.scss';

interface Props {
  hint?: string;
  placeholder: string;
}

const GridPlaceholder = ({ hint, placeholder }: Props) => {
  return (
    <div className={styles['text-container']}>
      <div className={styles.text}>{placeholder}</div>
      {hint && <div>{hint}</div>}
    </div>
  );
};

export default GridPlaceholder;
