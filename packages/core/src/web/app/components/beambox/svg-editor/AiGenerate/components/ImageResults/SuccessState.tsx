import { DownloadOutlined, ImportOutlined } from '@ant-design/icons';
import { Alert, Button } from 'antd';

import { handleDownload } from '../../utils/handleDownload';

import styles from './index.module.scss';

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
        {generatedImages.map((imageUrl, index) => (
          <div className={styles['image-card']} key={imageUrl}>
            <div className={styles['image-wrapper']}>
              <img alt={`Generated image ${index + 1}`} className={styles.image} src={imageUrl} />
              <div className={styles.overlay}>
                <Button
                  className={styles['action-button']}
                  icon={<ImportOutlined />}
                  loading={importingUrl === imageUrl}
                  onClick={() => onImport(imageUrl)}
                  size="large"
                  type="primary"
                >
                  Import
                </Button>
                <Button
                  className={styles['action-button']}
                  icon={<DownloadOutlined />}
                  onClick={() => handleDownload(imageUrl)}
                  size="large"
                >
                  Download
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
