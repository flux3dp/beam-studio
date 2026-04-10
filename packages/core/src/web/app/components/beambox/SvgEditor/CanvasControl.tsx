import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { DownOutlined } from '@ant-design/icons';
import { Dropdown, Slider } from 'antd';
import type { MenuProps } from 'antd';

import ZoomBlock from '@core/app/components/common/ZoomBlock';
import WorkareaIcons from '@core/app/icons/workarea/WorkareaIcons';
import { useCameraPreviewStore } from '@core/app/stores/cameraPreview';
import useI18n from '@core/helpers/useI18n';

import styles from './CanvasControl.module.scss';
import PreviewSlider from './PreviewSlider';
import TimeEstimationButton from './TimeEstimationButton';

type CanvasControlMode = 'exposure' | 'opacity' | 'time' | 'zoom';

const hasPreviewImage = (): boolean => {
  const container = document.querySelector('#previewSvg');

  return Boolean(container?.querySelector('#backgroundImage'));
};

interface Props {
  getZoom?: () => number;
  resetView?: () => void;
  setZoom?: (zoom: number) => void;
}

const CanvasControl = ({ getZoom, resetView, setZoom }: Props): React.ReactNode => {
  const [activeMode, setActiveMode] = useState<CanvasControlMode>('zoom');
  const { isPreviewMode } = useCameraPreviewStore();
  const lang = useI18n();

  const [opacity, setOpacity] = useState(1);
  const [hasBgImage, setHasBgImage] = useState(false);

  const updateBgOpacity = useCallback((val: number) => {
    const container: null | SVGGElement = document.querySelector('#previewSvg');

    if (container) container.style.opacity = String(val);
  }, []);

  useEffect(() => {
    if (isPreviewMode) {
      setHasBgImage(false);
      setOpacity(1);
      updateBgOpacity(1);
    } else {
      const exists = hasPreviewImage();

      setHasBgImage(exists);

      if (exists) updateBgOpacity(opacity);
    }
  }, [isPreviewMode, opacity, updateBgOpacity]);

  useEffect(() => {
    if (isPreviewMode) {
      setActiveMode('exposure');
    } else {
      setActiveMode((prev) => {
        if (prev === 'exposure') return hasPreviewImage() ? 'opacity' : 'zoom';

        return prev;
      });
    }
  }, [isPreviewMode]);

  const menuItems: MenuProps['items'] = useMemo(() => {
    const items: MenuProps['items'] = [
      {
        icon: <span className={styles.zoomIcon}>⤢</span>,
        key: 'zoom',
        label: lang.canvas_control.canvas_zoom,
      },
    ];

    if (isPreviewMode) {
      items.push({
        icon: <WorkareaIcons.Exposure />,
        key: 'exposure',
        label: lang.canvas_control.exposure,
      });
    } else if (hasBgImage) {
      items.push({
        icon: <WorkareaIcons.Opacity />,
        key: 'opacity',
        label: lang.canvas_control.opacity,
      });
    }

    items.push({
      icon: <WorkareaIcons.Time />,
      key: 'time',
      label: lang.beambox.time_est_button.calculate,
    });

    return items;
  }, [isPreviewMode, hasBgImage, lang]);

  const renderContent = () => {
    if (activeMode === 'exposure') {
      return <PreviewSlider />;
    }

    if (activeMode === 'opacity') {
      return (
        <>
          <Slider
            className={styles.slider}
            max={1}
            min={0}
            onChange={(val: number) => {
              setOpacity(val);
              updateBgOpacity(val);
            }}
            step={0.25}
            tooltip={{ open: false }}
            value={opacity}
          />
          <div className={styles.value}>{opacity * 100}%</div>
        </>
      );
    }

    if (activeMode === 'time') {
      return <TimeEstimationButton />;
    }

    if (activeMode === 'zoom') {
      return (
        <ZoomBlock
          className={styles.zoomContent}
          getZoom={getZoom}
          resetView={resetView ?? (() => undefined)}
          setZoom={setZoom ?? (() => undefined)}
        />
      );
    }

    return null;
  };

  const renderModeIcon = () => {
    if (activeMode === 'exposure') return <WorkareaIcons.Exposure className={styles.icon} />;

    if (activeMode === 'opacity') return <WorkareaIcons.Opacity className={styles.icon} />;

    if (activeMode === 'time') return <WorkareaIcons.Time className={styles.icon} />;

    return <span className={styles.zoomIcon}>⤢</span>;
  };

  return (
    <div>
      <div className={styles.container}>
        <Dropdown
          menu={{
            items: menuItems,
            onClick: ({ key }) => setActiveMode(key as CanvasControlMode),
            selectedKeys: [activeMode],
          }}
          placement="top"
          trigger={['click']}
        >
          <div className={styles.triggerArea}>
            {renderModeIcon()}
            <DownOutlined style={{ fontSize: '10px' }} />
          </div>
        </Dropdown>
        <div className={styles.divider} />
        {renderContent()}
      </div>
    </div>
  );
};

export default CanvasControl;
