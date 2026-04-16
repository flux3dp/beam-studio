import type { ReactNode } from 'react';
import React, { useEffect, useMemo, useState } from 'react';

import { ArrowsAltOutlined, DownOutlined } from '@ant-design/icons';
import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';

import constant from '@core/app/actions/beambox/constant';
import ZoomBlock from '@core/app/components/common/ZoomBlock';
import WorkareaIcons from '@core/app/icons/workarea/WorkareaIcons';
import { useCameraPreviewStore } from '@core/app/stores/cameraPreview';
import workareaManager from '@core/app/svgedit/workarea';
import useI18n from '@core/helpers/useI18n';

import styles from './CanvasControl.module.scss';
import OpacitySlider from './OpacitySlider';
import PreviewSlider from './PreviewSlider';
import TimeEstimationButton from './TimeEstimationButton';

type CanvasControlMode = 'exposure' | 'opacity' | 'time' | 'zoom';

const CanvasControl = (): ReactNode => {
  const [activeMode, setActiveMode] = useState<CanvasControlMode>('zoom');
  const isPreviewMode = useCameraPreviewStore((state) => state.isPreviewMode);
  const isClean = useCameraPreviewStore((state) => state.isClean);
  const lang = useI18n().canvas_control;

  useEffect(() => {
    if (isPreviewMode) {
      setActiveMode('exposure');
    } else {
      setActiveMode((prev) => {
        if (prev === 'exposure') return isClean ? 'zoom' : 'opacity';

        return prev;
      });
    }
  }, [isPreviewMode, isClean]);

  const menuItems: MenuProps['items'] = useMemo(() => {
    const items: MenuProps['items'] = [
      {
        icon: <ArrowsAltOutlined />,
        key: 'zoom',
        label: lang.canvas_zoom,
      },
    ];

    if (isPreviewMode) {
      items.push({
        icon: <WorkareaIcons.Exposure />,
        key: 'exposure',
        label: lang.exposure,
      });
    } else if (!isClean) {
      items.push({
        icon: <WorkareaIcons.Opacity />,
        key: 'opacity',
        label: lang.opacity,
      });
    }

    items.push({
      icon: <WorkareaIcons.Time />,
      key: 'time',
      label: lang.calculate,
    });

    return items;
  }, [isPreviewMode, isClean, lang]);

  const renderContent = () => {
    if (activeMode === 'exposure') return <PreviewSlider />;

    if (activeMode === 'opacity') return <OpacitySlider />;

    if (activeMode === 'time') return <TimeEstimationButton />;

    if (activeMode === 'zoom') {
      return (
        <ZoomBlock
          className={styles.zoomContent}
          ratioClassName={styles.ratio}
          resetView={workareaManager.resetView}
          setZoom={(zoom) => workareaManager.zoom(zoom / constant.dpmm)}
        />
      );
    }

    return null;
  };

  const renderModeIcon = () => {
    if (activeMode === 'exposure') return <WorkareaIcons.Exposure className={styles.icon} />;

    if (activeMode === 'opacity') return <WorkareaIcons.Opacity className={styles.icon} />;

    if (activeMode === 'time') return <WorkareaIcons.Time className={styles.icon} />;

    return <ArrowsAltOutlined className={styles.icon} />;
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
