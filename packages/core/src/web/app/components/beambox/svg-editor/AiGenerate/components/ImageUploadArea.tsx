import React, { memo, useEffect, useMemo, useRef, useState } from 'react';

import { CloseOutlined, FolderOutlined, InboxOutlined, LinkOutlined } from '@ant-design/icons';
import { Alert, Badge, Button } from 'antd';

import useI18n from '@core/helpers/useI18n';

import type { ImageInput } from '../types';
import { createFileInput } from '../types';

import styles from './ImageUploadArea.module.scss';

const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024;

const validateFiles = (
  files: File[],
  currentCount: number,
  maxImages: number,
  maxSize: number,
  t: ReturnType<typeof useI18n>['beambox']['ai_generate']['upload'],
) => {
  if (currentCount + files.length > maxImages) return t.max_images_error.replace('%s', String(maxImages));

  for (const file of files) {
    if (!ACCEPTED_TYPES.has(file.type)) {
      return t.file_type_error.replace('%s', file.name);
    }

    if (file.size > maxSize) {
      return t.file_size_error.replace('%s', file.name).replace('%s', String((maxSize / 1024 / 1024).toFixed(0)));
    }
  }

  return null;
};

const ThumbnailItem = ({
  index,
  input,
  onRemove,
  fromHistoryLabel,
}: {
  index: number;
  input: ImageInput;
  onRemove: (id: string) => void;
  fromHistoryLabel: string;
}) => {
  // Memoize object URL to prevent flicker and ensure cleanup
  const objectUrl = useMemo(() => (input.type === 'file' ? URL.createObjectURL(input.file) : input.url), [input]);

  // Auto-cleanup blob on unmount
  useEffect(() => {
    return () => {
      if (input.type === 'file') URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl, input.type]);

  return (
    <div className={styles['image-thumbnail']}>
      <div className={styles['number-badge']}>{index + 1}</div>
      {input.type === 'file' ? (
        <>
          <img alt={input.file.name} className={styles.image} src={objectUrl} />
          <div className={styles['image-name']}>{input.file.name}</div>
        </>
      ) : (
        <>
          <Badge.Ribbon className={styles['history-badge']} color="blue" text={<LinkOutlined />}>
            <img alt={fromHistoryLabel} className={styles.image} src={objectUrl} />
          </Badge.Ribbon>
          <div className={styles['image-name']}>{fromHistoryLabel}</div>
        </>
      )}
      <Button
        className={styles['remove-button']}
        icon={<CloseOutlined />}
        onClick={(e) => {
          e.stopPropagation();
          onRemove(input.id);
        }}
        shape="circle"
        size="small"
        type="text"
      />
    </div>
  );
};

const UnmemorizedImageUploadArea = ({
  imageInputs,
  maxImages = 10,
  maxSizeBytes = DEFAULT_MAX_SIZE,
  onAdd,
  onRemove,
}: any) => {
  const lang = useI18n();
  const t = lang.beambox.ai_generate;

  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<null | string>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;

    setError(null);

    const files = Array.from(fileList);

    const validationError = validateFiles(files, imageInputs.length, maxImages, maxSizeBytes, t.upload);

    if (validationError) {
      setError(validationError);

      return;
    }

    files.forEach((file) => onAdd(createFileInput(file)));
  };

  return (
    <div className={styles.container}>
      {error && (
        <Alert closable description={error} message={t.upload.error} onClose={() => setError(null)} type="error" />
      )}

      <div
        className={`${styles['drop-zone']} ${isDragging ? styles.dragging : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDragLeave={() => setIsDragging(false)}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <input
          accept=".jpg,.jpeg,.png,.webp"
          multiple
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
          ref={fileInputRef}
          style={{ display: 'none' }}
          type="file"
        />

        {imageInputs.length === 0 ? (
          <div className={styles['empty-state']}>
            <FolderOutlined className={styles.icon} />
            <p className={styles.title}>{t.upload.click_or_drag}</p>
            <p className={styles.subtitle}>{t.upload.supported_formats.replace('%s', String(maxImages))}</p>
          </div>
        ) : (
          <div className={styles['images-grid']}>
            {imageInputs.map((input: ImageInput, index: number) => (
              <ThumbnailItem
                fromHistoryLabel={t.upload.from_history}
                index={index}
                input={input}
                key={input.id}
                onRemove={onRemove}
              />
            ))}
            {imageInputs.length < maxImages && (
              <div className={styles['add-more']}>
                <InboxOutlined />
                <span>{t.upload.add}</span>
              </div>
            )}
          </div>
        )}
      </div>
      <div className={styles.info}>
        {t.upload.selected.replace('%s', String(imageInputs.length)).replace('%s', String(maxImages))}
      </div>
    </div>
  );
};

export default memo(UnmemorizedImageUploadArea);
