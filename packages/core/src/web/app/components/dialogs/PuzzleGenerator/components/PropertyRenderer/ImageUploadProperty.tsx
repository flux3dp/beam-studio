import React, { useCallback, useId, useMemo } from 'react';

import { UploadOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import { sprintf } from 'sprintf-js';

import alertCaller from '@core/app/actions/alert-caller';
import useI18n from '@core/helpers/useI18n';

import type { ImageUploadPropertyDef } from '../../types';

import styles from './PropertyRenderer.module.scss';

import type { BasePropertyProps } from './index';

const ImageUploadProperty = ({
  getValue,
  property,
  setValue,
}: BasePropertyProps<ImageUploadPropertyDef>): React.JSX.Element => {
  const { puzzle_generator: t } = useI18n();
  const inputId = useId();
  const parentKey = property.key.split('.')[0];
  const dataUrlKey = `${parentKey}.dataUrl`;
  const currentDataUrl = getValue(dataUrlKey) as null | string;
  const acceptedTypes = useMemo(() => property.accept.split(','), [property.accept]);

  const processFile = useCallback(
    (file: File) => {
      if (file.size > property.maxSizeMB * 1024 * 1024) {
        alertCaller.popUpError({
          message: t.file_too_large,
        });

        return;
      }

      if (!acceptedTypes.includes(file.type)) {
        alertCaller.popUpError({
          message: t.unsupported_file_type,
        });

        return;
      }

      const reader = new FileReader();

      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const img = new Image();

        img.onload = () => {
          if (img.width > property.maxResolution || img.height > property.maxResolution) {
            alertCaller.popUp({
              message: sprintf(t.image_resolution_warning, { resolution: property.maxResolution }),
              messageIcon: 'warning',
            });
          }

          setValue(dataUrlKey, dataUrl);
        };
        img.onerror = () => {
          console.error('Failed to load image for validation:', file.name);
          alertCaller.popUpError({ message: t.image_load_failed });
        };
        img.src = dataUrl;
      };
      reader.onerror = () => {
        console.error('FileReader failed to read file:', file.name, reader.error);
        alertCaller.popUpError({ message: t.image_load_failed });
      };

      reader.readAsDataURL(file);
    },
    [property.maxSizeMB, property.maxResolution, acceptedTypes, setValue, dataUrlKey, t],
  );

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (file) processFile(file);

      // Reset so re-selecting the same file triggers onChange again
      event.target.value = '';
    },
    [processFile],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const file = event.dataTransfer.files?.[0];

      if (file) processFile(file);
    },
    [processFile],
  );

  return (
    <div
      className={classNames(styles['image-upload'], { [styles['has-image']]: currentDataUrl })}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <input
        accept={property.accept}
        id={inputId}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        type="file"
      />
      <label htmlFor={inputId} style={{ cursor: 'pointer', display: 'block' }}>
        {currentDataUrl ? (
          <>
            <img alt="" className={styles['image-preview']} src={currentDataUrl} />
            <div className={styles['upload-text']}>{t.change_image}</div>
          </>
        ) : (
          <>
            <UploadOutlined className={styles['upload-icon']} />
            <div className={styles['upload-text']}>{t.upload_image}</div>
            <div className={styles['upload-hint']}>{t.upload_hint}</div>
          </>
        )}
      </label>
    </div>
  );
};

export default ImageUploadProperty;
