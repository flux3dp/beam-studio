import { Button, Modal } from 'antd';

import dialogCaller from '@core/app/actions/dialog-caller';
import ThumbnailCarousel from '@core/app/components/FileThumbnail/ThumbnailCarousel';
import { showThumbnailList } from '@core/app/components/FileThumbnail/ThumbnailList';
import { thumbnails, thumbnailsData } from '@core/app/components/FileThumbnail/utils';
import { mockT } from '@core/helpers/is-dev';

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
            <Button onClick={onClose}>{mockT('No')}</Button>
            <Button
              onClick={() => {
                dialogCaller.popDialogById(modelId);
                showThumbnailList(resolve);
              }}
              type="primary"
            >
              {mockT('Yes')}
            </Button>
          </>
        }
        onCancel={onClose}
        onClose={onClose}
        open
        title={mockT('是否要編輯縮圖？')}
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
