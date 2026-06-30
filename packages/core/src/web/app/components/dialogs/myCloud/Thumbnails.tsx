import React, { useMemo } from 'react';

import { Carousel } from 'antd';

import { previewThumbnailKey } from '@core/app/components/FileThumbnail/utils';
import type { IFile } from '@core/interfaces/IMyCloud';

import styles from './GridFile.module.scss';

interface Props {
  file: IFile;
  showBasicThumbnail?: boolean;
}

const Thumbnails = ({ file, showBasicThumbnail }: Props): React.JSX.Element => {
  const visibleThumbnails = useMemo(() => {
    if (showBasicThumbnail) {
      return [];
    } else if (file.thumbnails_data && file.thumbnails_data.length > 1) {
      return file.thumbnails_data
        .filter((t) => t.is_visible && (t.key === previewThumbnailKey || t.url))
        .map((t) => ({ key: t.key, src: t.url! }));
    } else if (file.thumbnails && file.thumbnails.length > 1) {
      return file.thumbnails.filter((t) => t.isVisible);
    } else {
      // fallback to normal if no thumbnails or only 1 thumbnail (which is preview thumbnail)
      return [];
    }
  }, [showBasicThumbnail, file.thumbnails, file.thumbnails_data]);

  console.log('Thumbnails', showBasicThumbnail, file, visibleThumbnails);

  const previewThumbnail = useMemo(
    () => (
      <div className={styles['guide-lines']} style={{ background: "url('core-img/flux-plus/guide-lines.png')" }}>
        <img src={`${file.thumbnail_url}?lastmod=${file.last_modified_at}`} />
      </div>
    ),
    [file.thumbnail_url, file.last_modified_at],
  );

  if (visibleThumbnails.length > 0) {
    return (
      <Carousel arrows autoplay rootClassName={styles.carousel}>
        {visibleThumbnails.map((t) => (
          <div className={styles['carousel-img-container']} key={t.key}>
            {t.key === previewThumbnailKey ? (
              previewThumbnail
            ) : (
              <img src={`${t.src}?lastmod=${file.last_modified_at}`} />
            )}
          </div>
        ))}
      </Carousel>
    );
  }

  return previewThumbnail;
};

export default Thumbnails;
