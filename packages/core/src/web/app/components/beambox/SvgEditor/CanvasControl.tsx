import type { ReactNode } from 'react';
import React, { useEffect, useMemo, useState } from 'react';

import { AimOutlined, ArrowsAltOutlined, DownOutlined, EyeOutlined } from '@ant-design/icons';
import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';

import constant from '@core/app/actions/beambox/constant';
import { ObjectControls, ViewControls } from '@core/app/components/beambox/InnerEngraving/CanvasControls';
import { DEFAULT_VIEW, getDefaultZoomLevel, useViewStore } from '@core/app/components/beambox/InnerEngraving/viewStore';
import ZoomBlock from '@core/app/components/common/ZoomBlock';
import WorkareaIcons from '@core/app/icons/workarea/WorkareaIcons';
import { useCameraPreviewStore } from '@core/app/stores/cameraPreview';
import workareaManager from '@core/app/svgedit/workarea';
import { useInnerEngravingActive } from '@core/helpers/innerEngraving';
import useI18n from '@core/helpers/useI18n';

import styles from './CanvasControl.module.scss';
import OpacitySlider from './OpacitySlider';
import PreviewSlider from './PreviewSlider';
import TimeEstimationButton from './TimeEstimationButton';

type CanvasControlMode = 'exposure' | 'innerEngravingObject' | 'innerEngravingView' | 'opacity' | 'time' | 'zoom';

const CanvasControl = (): ReactNode => {
  const [activeMode, setActiveMode] = useState<CanvasControlMode>('zoom');
  const isInnerEngraving = useInnerEngravingActive();
  const isPreviewMode = useCameraPreviewStore((state) => state.isPreviewMode);
  const isClean = useCameraPreviewStore((state) => state.isClean);
  const i18n = useI18n();
  const lang = i18n.canvas_control;

  useEffect(() => {
    if (isPreviewMode) {
      setActiveMode('exposure');
    } else {
      setActiveMode((prev) => {
        if (prev === 'exposure') return isClean ? 'zoom' : 'opacity';

        if (prev.startsWith('innerEngraving') && !isInnerEngraving) return 'zoom';

        return prev;
      });
    }
  }, [isClean, isInnerEngraving, isPreviewMode]);

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

    if (isInnerEngraving) {
      items.push({
        icon: <AimOutlined />,
        key: 'innerEngravingObject',
        label: lang.inner_engraving_object_control,
      });
      items.push({
        icon: <EyeOutlined />,
        key: 'innerEngravingView',
        label: lang.inner_engraving_view_control,
      });
    }

    items.push({
      icon: <WorkareaIcons.Time />,
      key: 'time',
      label: lang.calculate,
    });

    return items;
  }, [isClean, isInnerEngraving, isPreviewMode, lang]);

  const renderContent = () => {
    if (activeMode === 'exposure') return <PreviewSlider />;

    if (activeMode === 'opacity') return <OpacitySlider />;

    if (activeMode === 'time') return <TimeEstimationButton />;

    if (activeMode === 'innerEngravingObject') return <ObjectControls />;

    if (activeMode === 'innerEngravingView') return <ViewControls />;

    if (activeMode === 'zoom') {
      if (isInnerEngraving) {
        return (
          <ZoomBlock
            className={styles.zoomContent}
            // scene units are 0.1mm, and ZoomBlock speaks in screen pixels per mm. Until the canvas
            // has measured itself it has published nothing, so the framing it is about to open at
            // stands in — the same number, one paint earlier
            getZoom={() => (useViewStore.getState().zoomLevel || getDefaultZoomLevel()) * constant.dpmm}
            ratioClassName={styles.ratio}
            resetView={() => useViewStore.getState().requestView(DEFAULT_VIEW)}
            setZoom={(zoom) => useViewStore.getState().requestZoom(zoom / constant.dpmm)}
          />
        );
      }

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

    if (activeMode === 'innerEngravingObject') return <AimOutlined className={styles.icon} />;

    if (activeMode === 'innerEngravingView') return <EyeOutlined className={styles.icon} />;

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
