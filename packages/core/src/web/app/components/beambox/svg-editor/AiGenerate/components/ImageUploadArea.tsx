import React, { memo, useRef, useState } from 'react';

import { CloseOutlined, InboxOutlined, LinkOutlined } from '@ant-design/icons';
import { Alert, Badge, Button } from 'antd';

import type { ImageInput } from '../types';
import { createFileInput } from '../types';

import styles from './ImageUploadArea.module.scss';

interface ImageUploadAreaProps {
  imageInputs: ImageInput[];
  maxImages?: number;
  maxSizeBytes?: number;
  onAdd: (input: ImageInput) => void;
  onRemove: (id: string) => void;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_MAX_IMAGES = 10;

const validateFile = (
  file: File,
  currentCount: number,
  maxImages: number,
  maxSize: number,
): { error: string } | { file: File } => {
  // Check count
  if (currentCount >= maxImages) {
    return { error: `Maximum ${maxImages} images allowed` };
  }

  // Check type
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return { error: `${file.name}: Only JPEG, PNG, and WebP images are supported` };
  }

  // Check size
  if (file.size > maxSize) {
    const sizeMB = (maxSize / (1024 * 1024)).toFixed(0);

    return { error: `${file.name}: File size must be less than ${sizeMB}MB` };
  }

  return { file };
};

const UnmemorizedImageUploadArea = ({
  imageInputs,
  maxImages = DEFAULT_MAX_IMAGES,
  maxSizeBytes = DEFAULT_MAX_SIZE,
  onAdd,
  onRemove,
}: ImageUploadAreaProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<null | string>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalCount = imageInputs.length;

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    setError(null);

    const fileArray = Array.from(files);

    for (const file of fileArray) {
      const result = validateFile(file, totalCount, maxImages, maxSizeBytes);

      if ('error' in result) {
        setError(result.error);

        return;
      }

      onAdd(createFileInput(result.file));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);

    e.target.value = '';
  };

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(id);
    setError(null);
  };

  return (
    <div className={styles.container}>
      {error && (
        <Alert closable description={error} message="Upload Error" onClose={() => setError(null)} type="error" />
      )}

      <div
        className={`${styles['drop-zone']} ${isDragging ? styles.dragging : ''}`}
        onClick={handleClick}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFileInputChange}
          ref={fileInputRef}
          style={{ display: 'none' }}
          type="file"
        />

        {totalCount === 0 ? (
          <div className={styles['empty-state']}>
            <InboxOutlined className={styles.icon} />
            <p className={styles.title}>Click or drag images here</p>
            <p className={styles.subtitle}>
              JPEG, PNG, WebP • Max {maxImages} images • Max {(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB each
            </p>
          </div>
        ) : (
          <div className={styles['images-grid']}>
            {imageInputs.map((input, index) => {
              const displayNumber = index + 1; // 1-based for UI

              return (
                <div className={styles['image-thumbnail']} key={input.id}>
                  <div className={styles['number-badge']}>{displayNumber}</div>

                  {input.type === 'file' ? (
                    <>
                      <img
                        alt={input.file.name}
                        className={styles.image}
                        onLoad={(e) => {
                          const img = e.target as HTMLImageElement;

                          if (img.src.startsWith('blob:')) {
                            URL.revokeObjectURL(img.src);
                          }
                        }}
                        src={URL.createObjectURL(input.file)}
                      />
                      <div className={styles['image-name']}>{input.file.name}</div>
                    </>
                  ) : (
                    <>
                      <Badge.Ribbon className={styles['history-badge']} color="blue" text={<LinkOutlined />}>
                        <img alt={`Image ${displayNumber} from history`} className={styles.image} src={input.url} />
                      </Badge.Ribbon>
                      <div className={styles['image-name']}>From history</div>
                    </>
                  )}

                  <Button
                    className={styles['remove-button']}
                    icon={<CloseOutlined />}
                    onClick={(e) => handleRemove(input.id, e)}
                    shape="circle"
                    size="small"
                    type="text"
                  />
                </div>
              );
            })}

            {totalCount < maxImages && (
              <div className={styles['add-more']}>
                <InboxOutlined />
                <span>Add more</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className={styles.info}>
        {totalCount} / {maxImages} images selected
      </div>
    </div>
  );
};

const ImageUploadArea = memo(UnmemorizedImageUploadArea);

export default ImageUploadArea;
