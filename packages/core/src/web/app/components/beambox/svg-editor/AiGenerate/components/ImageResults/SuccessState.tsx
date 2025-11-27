import { DownloadOutlined, ImportOutlined } from '@ant-design/icons';
import { Alert, Button } from 'antd';

import { handleDownload } from '../../utils/handleDownload'; //

import styles from './index.module.scss';

const ResultImage = ({
  isImporting,
  onImport,
  url,
}: {
  isImporting: boolean;
  onImport: (url: string) => void;
  url: string;
}) => (
  <div className={styles['image-card']}>
    <div className={styles['image-wrapper']}>
      <img alt="Generated result" className={styles.image} src={url} />
      <div className={styles.overlay}>
        <Button
          className={styles['action-button']}
          icon={<ImportOutlined />}
          loading={isImporting}
          onClick={() => onImport(url)}
          size="large"
          type="primary"
        >
          Import
        </Button>
        <Button
          className={styles['action-button']}
          icon={<DownloadOutlined />}
          onClick={() => handleDownload(url)}
          size="large"
        >
          Download
        </Button>
      </div>
    </div>
  </div>
);

export const SuccessState = ({
  generatedImages,
  importError,
  importingUrl,
  onImport,
  setImportError,
}: {
  generatedImages: string[];
  importError: null | string;
  importingUrl: null | string;
  onImport: (url: string) => void;
  setImportError: (val: null | string) => void;
}) => {
  if (!generatedImages.length) return null;

  return (
    <>
      {importError && (
        <Alert
          closable
          description={importError}
          message="Import Failed"
          onClose={() => setImportError(null)}
          showIcon
          style={{ marginBottom: 16 }}
          type="error"
        />
      )}
      <div className={styles['images-grid']}>
        {generatedImages.map((url) => (
          <ResultImage isImporting={importingUrl === url} key={url} onImport={onImport} url={url} />
        ))}
      </div>
    </>
  );
};
