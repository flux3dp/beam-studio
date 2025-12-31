import { Alert } from 'antd';

import useI18n from '@core/helpers/useI18n';

import ImageCard from '../ImageCard';

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
          <ImageCard
            aspectRatio="1:1"
            isImporting={importingUrl === url}
            key={url}
            onImport={onImport}
            size="large"
            url={url}
          />
        ))}
      </div>
    </>
  );
};
