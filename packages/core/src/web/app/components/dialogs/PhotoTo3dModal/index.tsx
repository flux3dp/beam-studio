import React from 'react';

import alertCaller from '@core/app/actions/alert-caller';
import dialogCaller from '@core/app/actions/dialog-caller';
import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import { getPhotoTextureUrl } from '@core/app/svgedit/stl/photoPlane';
import { loadRasterData } from '@core/app/svgedit/stl/photoPointCloudGenerator';
import { checkPhotoTo3dSize } from '@core/app/svgedit/stl/photoTo3d';
import { getCurrentUser } from '@core/helpers/api/flux-id';
import i18n from '@core/helpers/i18n';

import PhotoTo3dModal from './PhotoTo3dModal';

/** More than this share of not fully opaque pixels means the photo already has its background removed. */
const TRANSPARENT_SHARE = 0.01;

export const hasTransparentBackground = ({ data }: { data: ArrayLike<number> }): boolean => {
  const pixels = data.length / 4;
  let transparent = 0;

  for (let i = 3; i < data.length; i += 4) if (data[i] < 255) transparent += 1;

  return transparent > pixels * TRANSPARENT_SHARE;
};

/** Checks login and the dot count, works out the background default, then opens the dialog. */
export const showPhotoTo3dModal = async (element: SVGImageElement): Promise<void> => {
  const id = 'photo-to-3d-modal';

  if (isIdExist(id)) return;

  if (!getCurrentUser()) {
    dialogCaller.showLoginDialog();

    return;
  }

  if (!checkPhotoTo3dSize(element)) {
    alertCaller.popUp({ message: i18n.lang.inner_engraving_settings.photo_to_3d_too_large });

    return;
  }

  const source = element.getAttribute('origImage') || getPhotoTextureUrl(element);
  let hasTransparency = false;

  try {
    if (source) hasTransparency = hasTransparentBackground(await loadRasterData(source));
  } catch (error) {
    console.error('Unable to read the photo for its transparency', error);
  }

  addDialogComponent(
    id,
    <PhotoTo3dModal element={element} hasTransparency={hasTransparency} onClose={() => popDialogById(id)} />,
  );
};
