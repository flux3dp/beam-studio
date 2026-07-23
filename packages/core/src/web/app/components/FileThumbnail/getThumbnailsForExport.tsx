import { Button, Modal } from 'antd';

import dialogCaller from '@core/app/actions/dialog-caller';
import ThumbnailCarousel from '@core/app/components/FileThumbnail/ThumbnailCarousel';
import { showThumbnailList } from '@core/app/components/FileThumbnail/ThumbnailList';
import { thumbnails, thumbnailsData } from '@core/app/components/FileThumbnail/utils';
import i18n from '@core/helpers/i18n';

export type ExportThumbnail = {
  data: ArrayBuffer | null;
  isVisible: boolean;
  key: string;
};

export const askToEditThumbnails = () => {
  const modelId = 'thumbnail-carousel-modal';

  return new Promise<void>((resolve) => {
    const onClose = () => {
      dialogCaller.popDialogById(modelId);
      resolve();
    };

    dialogCaller.addDialogComponent(
      modelId,
      <Modal
        centered
        footer={
          <>
            <Button onClick={onClose}>{i18n.lang.alert.no}</Button>
            <Button
              onClick={() => {
                dialogCaller.popDialogById(modelId);
                showThumbnailList(resolve);
              }}
              type="primary"
            >
              {i18n.lang.alert.yes}
            </Button>
          </>
        }
        onCancel={onClose}
        onClose={onClose}
        open
        title={i18n.lang.template_thumbnail.edit_thumbnails_confirm}
      >
        <ThumbnailCarousel />
      </Modal>,
    );
  });
};

export const getThumbnailsForExport = async (askUser = true): Promise<ExportThumbnail[]> => {
  if (askUser) {
    await askToEditThumbnails();
  }

  const exportThumbnails = thumbnails.map((key) => {
    const info = thumbnailsData[key];

    return {
      blob: info.isPreview ? null : info.blob,
      isVisible: info.isVisible,
      key,
    };
  });

  const thumbnailsList = await Promise.all(
    exportThumbnails.map(async (t) => ({
      data: t.blob ? await t.blob.arrayBuffer() : null,
      isVisible: t.isVisible,
      key: t.key,
    })),
  );

  return thumbnailsList;
};
