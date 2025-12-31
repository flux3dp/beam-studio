import { DownloadOutlined, ImportOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import classNames from 'classnames';

import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import { isMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import { handleDownload } from '../utils/handleDownload';

import styles from './ImageCard.module.scss';

interface ImageCardProps {
  /** Aspect ratio of the image container */
  aspectRatio?: '1:1' | '4:3';
  className?: string;
  isImporting: boolean;
  onImport: (url: string) => void;
  /** Button size: 'small' for compact cards (HistoryCard), 'large' for main results (SuccessState) */
  size?: 'large' | 'small';
  url: string;
}

/**
 * Shared image card component for AI-generated images.
 *
 * On mobile: Tapping the image triggers import and closes the drawer.
 * On desktop: Hover overlay with Import and Download buttons.
 */
const ImageCard = ({ aspectRatio = '1:1', className, isImporting, onImport, size = 'large', url }: ImageCardProps) => {
  const {
    beambox: { ai_generate: t },
  } = useI18n();
  const { setDrawerMode } = useCanvasStore();

  const handleMobileClick = () => {
    onImport(url);
    setDrawerMode('none');
  };

  const cardClassName = classNames(styles.card, styles[`aspect-${aspectRatio.replace(':', '-')}`], className);
  const overlayClassName = classNames(styles.overlay, {
    [styles['overlay-large']]: size === 'large',
    [styles['overlay-small']]: size === 'small',
  });
  const buttonClassName = classNames(styles.button, {
    [styles['button-large']]: size === 'large',
    [styles['button-small']]: size === 'small',
  });

  if (isMobile()) {
    return (
      <div className={cardClassName} onClick={handleMobileClick}>
        <img alt="Generated result" className={styles.image} src={url} />
      </div>
    );
  }

  return (
    <div className={cardClassName}>
      <img alt="Generated result" className={styles.image} src={url} />
      <div className={overlayClassName}>
        <Button
          className={buttonClassName}
          icon={<ImportOutlined />}
          loading={isImporting}
          onClick={() => onImport(url)}
          size={size}
          type="primary"
        >
          {t.results.import}
        </Button>
        <Button className={buttonClassName} icon={<DownloadOutlined />} onClick={() => handleDownload(url)} size={size}>
          {t.results.download}
        </Button>
      </div>
    </div>
  );
};

export default ImageCard;
