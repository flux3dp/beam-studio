import { DownloadOutlined, ImportOutlined } from '@ant-design/icons';
import { Alert, Button } from 'antd';

import useI18n from '@core/helpers/useI18n';

import { handleDownload } from '../../utils/handleDownload';

import styles from './index.module.scss';

const ResultImage = ({
  downloadLabel,
  importLabel,
  isImporting,
  onImport,
  url,
}: {
  downloadLabel: string;
  importLabel: string;
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
          {importLabel}
        </Button>
        <Button
          className={styles['action-button']}
          icon={<DownloadOutlined />}
          onClick={() => handleDownload(url)}
          size="large"
        >
          {downloadLabel}
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
  const lang = useI18n();
  const t = lang.beambox.ai_generate;

  if (!generatedImages.length) return null;

  return (
    <>
      {importError && (
        <Alert
          closable
          description={importError}
          message={t.error.import_failed}
          onClose={() => setImportError(null)}
          showIcon
          style={{ marginBottom: 16 }}
          type="error"
        />
      )}
      <div className={styles['images-grid']}>
        {generatedImages.map((url) => (
          <ResultImage
            downloadLabel={t.results.download}
            importLabel={t.results.import}
            isImporting={importingUrl === url}
            key={url}
            onImport={onImport}
            url={url}
          />
        ))}
      </div>
    </>
  );
};
