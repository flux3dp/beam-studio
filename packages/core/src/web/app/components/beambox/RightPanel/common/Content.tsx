import styles from './Content.module.scss';

// Common wrapper styles for object panel popup
const Content = ({ children }: { children: React.ReactNode }) => {
  return <div className={styles.content}>{children}</div>;
};

export default Content;
