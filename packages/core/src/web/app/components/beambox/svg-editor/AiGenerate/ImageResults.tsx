import React, { memo, useState } from 'react';

import { DownloadOutlined, ImportOutlined } from '@ant-design/icons';
import { Alert, Button, Spin } from 'antd';

import importAiImage from '@core/app/svgedit/operations/import/importAiImage';

import styles from './ImageResults.module.scss';

interface ImageResultsProps {
  errorMessage: null | string;
  generatedImages: string[];
  generationStatus: 'failed' | 'generating' | 'idle' | 'success';
}

const UnmemorizedImageResults = ({ errorMessage, generatedImages, generationStatus }: ImageResultsProps) => {
  const [importingUrl, setImportingUrl] = useState<null | string>(null);
  const [importError, setImportError] = useState<null | string>(null);

  const handleImport = async (imageUrl: string) => {
    setImportingUrl(imageUrl);
    setImportError(null);

    try {
      await importAiImage(imageUrl);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to import image';

      setImportError(errorMsg);
    } finally {
      setImportingUrl(null);
    }
  };

  const handleDownload = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = `ai-generated-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  // Don't render if idle
  if (generationStatus === 'idle') {
    return null;
  }

  return (
    <div className={styles['results-container']}>
      <h3 className={styles['section-title']}>Results</h3>

      {generationStatus === 'generating' && (
        <div className={styles['loading-container']}>
          <Spin size="large" />
          <p className={styles['loading-text']}>Generating your images...</p>
        </div>
      )}

      {generationStatus === 'failed' && errorMessage && (
        <Alert closable description={errorMessage} message="Generation Failed" showIcon type="error" />
      )}

      {generationStatus === 'success' && generatedImages.length > 0 && (
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
                      disabled={importingUrl === imageUrl}
                      icon={<ImportOutlined />}
                      loading={importingUrl === imageUrl}
                      onClick={() => handleImport(imageUrl)}
                      size="large"
                      type="primary"
                    >
                      {importingUrl === imageUrl ? 'Importing...' : 'Import'}
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
      )}
    </div>
  );
};

const ImageResults = memo(UnmemorizedImageResults);

export default ImageResults;
