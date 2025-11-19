import React, { memo, useEffect, useMemo, useRef, useState } from 'react';

import { CloseOutlined, InboxOutlined, LinkOutlined } from '@ant-design/icons';
import { Alert, Badge, Button } from 'antd';

import type { ImageInput } from '../types';
import { createFileInput } from '../types';

import styles from './ImageUploadArea.module.scss';

const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024;

const validateFiles = (files: File[], currentCount: number, maxImages: number, maxSize: number) => {
  if (currentCount + files.length > maxImages) return `Maximum ${maxImages} images allowed`;

  for (const file of files) {
    if (!ACCEPTED_TYPES.has(file.type)) return `${file.name}: Only JPEG, PNG, and WebP images are supported`;

    if (file.size > maxSize) return `${file.name}: File size must be less than ${(maxSize / 1024 / 1024).toFixed(0)}MB`;
  }

  return null;
};

const ThumbnailItem = ({
  index,
  input,
  onRemove,
}: {
  index: number;
  input: ImageInput;
  onRemove: (id: string) => void;
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
            <img alt="From history" className={styles.image} src={objectUrl} />
          </Badge.Ribbon>
          <div className={styles['image-name']}>From history</div>
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
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<null | string>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;

    setError(null);

    const files = Array.from(fileList);

    const validationError = validateFiles(files, imageInputs.length, maxImages, maxSizeBytes);

    if (validationError) {
      setError(validationError);

      return;
    }

    files.forEach((file) => onAdd(createFileInput(file)));
  };

  return (
    <div className={styles.container}>
      {error && (
        <Alert closable description={error} message="Upload Error" onClose={() => setError(null)} type="error" />
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
            <InboxOutlined className={styles.icon} />
            <p className={styles.title}>Click or drag images here</p>
            <p className={styles.subtitle}>JPEG, PNG, WebP • Max {maxImages}</p>
          </div>
        ) : (
          <div className={styles['images-grid']}>
            {imageInputs.map((input: ImageInput, index: number) => (
              <ThumbnailItem index={index} input={input} key={input.id} onRemove={onRemove} />
            ))}
            {imageInputs.length < maxImages && (
              <div className={styles['add-more']}>
                <InboxOutlined />
                <span>Add</span>
              </div>
            )}
          </div>
        )}
      </div>
      <div className={styles.info}>
        {imageInputs.length} / {maxImages} selected
      </div>
    </div>
  );
};

export default memo(UnmemorizedImageUploadArea);
