// Convert to a store?

import generateThumbnail from '@core/app/actions/beambox/export/generate-thumbnail';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import symbolMaker from '@core/helpers/symbol-helper/symbolMaker';

type ThumbnailInfo = {
  blob: Blob | null;
  isPreview?: boolean;
  isVisible: boolean;
  isVisibleDisabled?: boolean;
  src: string;
};

export const previewThumbnailKey = 'preview';

const eventEmitter = eventEmitterFactory.createEventEmitter('thumbnail');
const emitThumbnailDataChange = (key: string) => eventEmitter.emit(`dataChange-${key}`);
const emitThumbnailOrderChange = () => eventEmitter.emit('orderChange');

export const onThumbnailDataChange = (key: string, callback: () => void) => {
  eventEmitter.on(`dataChange-${key}`, callback);

  return () => {
    eventEmitter.off(`dataChange-${key}`, callback);
  };
};

export const onThumbnailOrderChange = (callback: () => void) => {
  eventEmitter.on('orderChange', callback);

  return () => {
    eventEmitter.off('orderChange', callback);
  };
};

export const thumbnailsData: { [key: string]: ThumbnailInfo } = {};
export const thumbnails: string[] = [];

export const resetThumbnails = () => {
  for (const key of thumbnails) {
    const thumbnail = thumbnailsData[key];

    if (thumbnail.src) URL.revokeObjectURL(thumbnail.src);

    delete thumbnailsData[key];
  }

  thumbnails.length = 0;
  thumbnailsData[previewThumbnailKey] = {
    blob: null,
    isPreview: true,
    isVisible: true,
    isVisibleDisabled: true,
    src: '',
  };
  emitThumbnailOrderChange();
};
resetThumbnails();

export const refreshPreview = async () => {
  if (!thumbnails.includes(previewThumbnailKey)) {
    thumbnails.push(previewThumbnailKey);
  }

  const previewThumbnail = thumbnailsData[previewThumbnailKey];

  if (previewThumbnail.src) URL.revokeObjectURL(previewThumbnail.src);

  symbolMaker.switchImageSymbolForAll(false);

  const { thumbnailBlobURL } = await generateThumbnail();

  symbolMaker.switchImageSymbolForAll(true);

  previewThumbnail.src = thumbnailBlobURL;
  emitThumbnailDataChange(previewThumbnailKey);
};

export const addThumbnail = (blob: Blob | null, options?: { isVisible?: boolean; key?: string; src?: string }) => {
  const key = options?.key ?? `thumbnail-${Date.now()}`;
  const isVisible = options?.isVisible ?? true;
  const src = options?.src ?? (blob?.size ? URL.createObjectURL(blob) : '');

  thumbnailsData[key] = { blob, isPreview: key === previewThumbnailKey, isVisible, src };
  thumbnails.push(key);
  emitThumbnailOrderChange();

  if (thumbnails.length === 2) {
    thumbnailsData[previewThumbnailKey].isVisibleDisabled = false;
    emitThumbnailDataChange(previewThumbnailKey);
  }
};

export const removeThumbnail = (key: string) => {
  if (key === previewThumbnailKey) return;

  const thumbnail = thumbnailsData[key];

  if (thumbnail?.src) URL.revokeObjectURL(thumbnail.src);

  delete thumbnailsData[key];

  const index = thumbnails.indexOf(key);

  if (index !== -1) {
    thumbnails.splice(index, 1);
    emitThumbnailOrderChange();
  }

  if (thumbnails.length === 1) {
    thumbnailsData[previewThumbnailKey].isVisible = true;
    thumbnailsData[previewThumbnailKey].isVisibleDisabled = true;
    emitThumbnailDataChange(previewThumbnailKey);
  }
};

export const togglePreviewVisibility = () => {
  const previewThumbnail = thumbnailsData[previewThumbnailKey];

  previewThumbnail.isVisible = thumbnails.length === 1 ? true : !previewThumbnail.isVisible;
  emitThumbnailDataChange(previewThumbnailKey);
};

export const reorderThumbnails = (sourceIndex: number, destinationIndex: number) => {
  const [removed] = thumbnails.splice(sourceIndex, 1);

  thumbnails.splice(destinationIndex, 0, removed);
  emitThumbnailOrderChange();
};
