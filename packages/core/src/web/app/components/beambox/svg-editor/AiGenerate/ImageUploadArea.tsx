import React, { memo, useRef, useState } from 'react';

import { CloseOutlined, InboxOutlined } from '@ant-design/icons';
import { Alert, Button } from 'antd';

import styles from './ImageUploadArea.module.scss';

interface ImageUploadAreaProps {
  images: File[];
  maxImages?: number;
  maxSizeBytes?: number;
  onAdd: (file: File) => void;
  onRemove: (index: number) => void;
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
  images,
  maxImages = DEFAULT_MAX_IMAGES,
  maxSizeBytes = DEFAULT_MAX_SIZE,
  onAdd,
  onRemove,
}: ImageUploadAreaProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<null | string>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    setError(null);

    const fileArray = Array.from(files);

    for (const file of fileArray) {
      const result = validateFile(file, images.length, maxImages, maxSizeBytes);

      if ('error' in result) {
        setError(result.error);

        return;
      }

      onAdd(result.file);
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
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleRemove = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(index);
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

        {images.length === 0 ? (
          <div className={styles['empty-state']}>
            <InboxOutlined className={styles.icon} />
            <p className={styles.title}>Click or drag images here</p>
            <p className={styles.subtitle}>
              JPEG, PNG, WebP • Max {maxImages} images • Max {(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB each
            </p>
          </div>
        ) : (
          <div className={styles['images-grid']}>
            {images.map((file, index) => {
              const imageUrl = URL.createObjectURL(file);

              return (
                <div className={styles['image-thumbnail']} key={`${file.name}-${index}`}>
                  <img
                    alt={file.name}
                    className={styles.image}
                    onLoad={() => URL.revokeObjectURL(imageUrl)}
                    src={imageUrl}
                  />
                  <Button
                    className={styles['remove-button']}
                    icon={<CloseOutlined />}
                    onClick={(e) => handleRemove(index, e)}
                    shape="circle"
                    size="small"
                    type="text"
                  />
                  <div className={styles['image-name']}>{file.name}</div>
                </div>
              );
            })}

            {images.length < maxImages && (
              <div className={styles['add-more']}>
                <InboxOutlined />
                <span>Add more</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className={styles.info}>
        {images.length} / {maxImages} images selected
      </div>
    </div>
  );
};

const ImageUploadArea = memo(UnmemorizedImageUploadArea);

export default ImageUploadArea;
