import React, { memo, useEffect, useMemo, useRef, useState } from 'react';

import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { Alert, Button, Input } from 'antd';
import classNames from 'classnames';

import LeftPanelIcons from '@core/app/icons/left-panel/LeftPanelIcons';
import type { InputField } from '@core/helpers/api/ai-image-config';
import useI18n from '@core/helpers/useI18n';

import type { ImageInput } from '../types';
import { createFileInput } from '../types';
import {
  ACCEPTED_EXTENSIONS,
  DEFAULT_MAX_IMAGES,
  DEFAULT_MAX_SIZE_BYTES,
  validateImageFiles,
} from '../utils/fileValidation';

import styles from './InputField.module.scss';

const Thumbnail = ({ input, onRemove }: { input: ImageInput; onRemove: (id: string) => void }) => {
  const src = useMemo(() => (input.type === 'file' ? URL.createObjectURL(input.file) : input.url), [input]);

  useEffect(
    () => () => {
      if (input.type === 'file') URL.revokeObjectURL(src);
    },
    [src, input.type],
  );

  return (
    <div className={styles.thumbnail}>
      <img alt="Upload" className={styles['thumbnail-image']} src={src} />
      <Button
        className={styles['remove-btn']}
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

interface Props {
  field: InputField;
  imageInputs: ImageInput[];
  maxImages?: number;
  maxSizeBytes?: number;
  onAddImage: (input: ImageInput) => void;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onRemoveImage: (id: string) => void;
  value: string;
}

const UnmemorizedInputFieldWithUpload = ({
  field,
  imageInputs,
  maxImages = DEFAULT_MAX_IMAGES,
  maxSizeBytes = DEFAULT_MAX_SIZE_BYTES,
  onAddImage,
  onChange,
  onKeyDown,
  onRemoveImage,
  value,
}: Props) => {
  const lang = useI18n();
  const t = lang.beambox.ai_generate;

  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<null | string>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canAddMore = imageInputs.length < maxImages;

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;

    setError(null);

    const files = Array.from(fileList);
    const err = validateImageFiles(files, imageInputs.length, maxImages, maxSizeBytes);

    if (err) {
      return setError(err);
    }

    files.forEach((file) => onAddImage(createFileInput(file)));
  };

  // Drag handlers
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();

    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      className={classNames(styles.wrapper, { [styles.dragging]: isDragging })}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {error && (
        <Alert
          className={styles.error}
          closable
          description={error}
          message={t.upload_error}
          onClose={() => setError(null)}
          type="error"
        />
      )}

      <input
        accept={ACCEPTED_EXTENSIONS}
        multiple
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
        ref={fileInputRef}
        style={{ display: 'none' }}
        type="file"
      />

      <div className={styles['input-container']}>
        <Input.TextArea
          className={styles.textarea}
          maxLength={field.maxLength}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onKeyUp={(e) => e.stopPropagation()}
          placeholder={field.placeholder}
          rows={5}
          style={{ resize: 'none' }}
          value={value}
        />

        <div className={styles['bottom-bar']}>
          <button
            className={classNames(styles['upload-btn'], { [styles.disabled]: !canAddMore })}
            disabled={!canAddMore}
            onClick={() => fileInputRef.current?.click()}
            title={t.upload_images}
            type="button"
          >
            <LeftPanelIcons.Image />
          </button>

          {imageInputs.length > 0 && (
            <span className={styles['image-count']}>
              {imageInputs.length}/{maxImages}
            </span>
          )}
          {field.maxLength && (
            <span className={styles['char-count']}>
              {value.length} / {field.maxLength}
            </span>
          )}
        </div>
      </div>

      {imageInputs.length > 0 && (
        <div className={styles['thumbnail-grid']}>
          {imageInputs.map((input) => (
            <Thumbnail input={input} key={input.id} onRemove={onRemoveImage} />
          ))}
          {canAddMore && (
            <button className={styles['add-placeholder']} onClick={() => fileInputRef.current?.click()} type="button">
              <PlusOutlined />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const InputFieldWithUpload = memo(UnmemorizedInputFieldWithUpload);

export default InputFieldWithUpload;
