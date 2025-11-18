import React, { memo, useCallback, useMemo, useState } from 'react';

import { DownloadOutlined, ImportOutlined } from '@ant-design/icons';
import { Alert, Button, Spin } from 'antd';
import { match } from 'ts-pattern';

import { importAiImage } from '@core/app/svgedit/operations/import/importAiImage';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';

import styles from './ImageResults.module.scss';

interface ImageResultsProps {
  errorMessage: null | string;
  generatedImages: string[];
  generationStatus: 'failed' | 'generating' | 'idle' | 'success';
}

/**
 * Helper function to download a file from a URL.
 * This is a pure utility and doesn't need to be in the component.
 */
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

const UnmemorizedImageResults = ({ errorMessage, generatedImages, generationStatus }: ImageResultsProps) => {
  const lang = useI18n();
  const [importingUrl, setImportingUrl] = useState<null | string>(null);
  const [importError, setImportError] = useState<null | string>(null);
  const { displayErrorMessage, isInsufficientCredits } = useMemo(() => {
    if (!errorMessage) {
      return { displayErrorMessage: null, isInsufficientCredits: false };
    }

    const parts = errorMessage.split(':');
    const errorCode = parts.length > 1 ? parts[0] : null;

    return {
      displayErrorMessage: parts.length > 1 ? parts.slice(1).join(':') : errorMessage,
      isInsufficientCredits: errorCode === 'INSUFFICIENT_CREDITS',
    };
  }, [errorMessage]);

  const handleImport = useCallback(async (imageUrl: string) => {
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
  }, []);

  const renderContent = () =>
    match(generationStatus)
      .with('generating', () => (
        <div className={styles['loading-container']}>
          <Spin size="large" />
          <p className={styles['loading-text']}>Generating your images...</p>
        </div>
      ))
      .with('failed', () => {
        if (!errorMessage) {
          return null;
        }

        if (!isInsufficientCredits) {
          return <Alert closable description={displayErrorMessage} message="Generation Failed" showIcon type="error" />;
        }

        return (
          <Alert
            closable
            description={
              <div style={{ alignItems: 'center', display: 'flex', gap: 12, justifyContent: 'space-between' }}>
                <span>{displayErrorMessage}</span>
                <Button
                  onClick={() => browser.open(lang.flux_id_login.flux_plus.member_center_url)}
                  size="small"
                  type="primary"
                >
                  {lang.flux_id_login.flux_plus.goto_member_center}
                </Button>
              </div>
            }
            message="Insufficient Credits"
            showIcon
            type="warning"
          />
        );
      })
      .with('success', () => {
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
                        loading={importingUrl === imageUrl} // SIMPLIFIED
                        onClick={() => handleImport(imageUrl)}
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
      })
      .otherwise(() => null);

  if (generationStatus === 'idle') {
    return null;
  }

  return (
    <div className={styles['results-container']}>
      <h3 className={styles['section-title']}>Results</h3>
      {renderContent()}
    </div>
  );
};

const ImageResults = memo(UnmemorizedImageResults);

export default ImageResults;
