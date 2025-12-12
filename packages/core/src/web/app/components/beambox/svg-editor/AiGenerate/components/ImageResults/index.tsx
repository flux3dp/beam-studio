import React, { memo, useCallback, useState } from 'react';

import { importAiImage } from '@core/app/svgedit/operations/import/importAiImage';
import useI18n from '@core/helpers/useI18n';

import { ErrorState } from './ErrorState';
import styles from './index.module.scss';
import { LoadingState } from './LoadingState';
import { SuccessState } from './SuccessState';

interface ImageResultsProps {
  errorMessage: null | string;
  generatedImages: string[];
  generationStatus: 'failed' | 'generating' | 'idle' | 'success';
}

const UnmemorizedImageResults = ({ errorMessage, generatedImages, generationStatus }: ImageResultsProps) => {
  const lang = useI18n();
  const t = lang.beambox.ai_generate;

  const [importingUrl, setImportingUrl] = useState<null | string>(null);
  const [importError, setImportError] = useState<null | string>(null);

  const handleImport = useCallback(async (imageUrl: string) => {
    setImportingUrl(imageUrl);
    setImportError(null);
    try {
      await importAiImage(imageUrl);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Failed to import image');
    } finally {
      setImportingUrl(null);
    }
  }, []);

  if (generationStatus === 'idle') return null;

  return (
    <div className={styles['results-container']}>
      <h3 className={styles['section-title']}>{t.results.title}</h3>

      {generationStatus === 'generating' && <LoadingState />}

      {generationStatus === 'failed' && <ErrorState error={errorMessage} />}

      {generationStatus === 'success' && (
        <SuccessState
          generatedImages={generatedImages}
          importError={importError}
          importingUrl={importingUrl}
          onImport={handleImport}
          setImportError={setImportError}
        />
      )}
    </div>
  );
};

const ImageResults = memo(UnmemorizedImageResults);

export default ImageResults;
