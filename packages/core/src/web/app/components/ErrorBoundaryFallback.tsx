import { Button } from 'antd';

import styles from './ErrorBoundaryFallback.module.scss';

interface Props {
  error: Error;
}

const ErrorBoundaryFallback = ({ error }: Props) => {
  return (
    <div className={styles.container} role="alert">
      <h2>There is something wrong about Beam Studio:</h2>
      <pre>{error.message}</pre>
      <p>Stack trace:</p>
      <pre>{error.stack}</pre>
      <div className={styles.buttonContainer}>
        <Button onClick={() => location.reload()} type="primary">
          Reload
        </Button>
      </div>
    </div>
  );
};

export default ErrorBoundaryFallback;
