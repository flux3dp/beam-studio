import React, { memo, useCallback, useState } from 'react';

import { match } from 'ts-pattern';

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

const ImageResults = memo(({ errorMessage, generatedImages, generationStatus }: ImageResultsProps) => {
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

  const renderContent = match(generationStatus)
    .with('generating', () => <LoadingState />)
    .with('failed', () => <ErrorState error={errorMessage} />)
    .with('success', () => (
      <SuccessState
        generatedImages={generatedImages}
        importError={importError}
        importingUrl={importingUrl}
        onImport={handleImport}
        setImportError={setImportError}
      />
    ))
    .exhaustive();

  return (
    <div className={styles['results-container']}>
      <h3 className={styles['section-title']}>{t.results.title}</h3>
      {renderContent}
    </div>
  );
});

export default ImageResults;
