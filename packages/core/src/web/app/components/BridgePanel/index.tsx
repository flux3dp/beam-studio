import React, { memo, useCallback, useEffect, useRef, useState } from 'react';

import { Flex } from 'antd';
import paper from 'paper';

import progressCaller from '@core/app/actions/progress-caller';
import FullWindowPanel from '@core/app/widgets/FullWindowPanel/FullWindowPanel';
import useNewShortcutsScope from '@core/helpers/hooks/useNewShortcutsScope';
import shortcuts from '@core/helpers/shortcuts';
import useForceUpdate from '@core/helpers/use-force-update';
import useI18n from '@core/helpers/useI18n';

import styles from './index.module.scss';
import Sider from './Sider';
import TopBar from './TopBar';
import { cutPathAtDistance } from './utils/cutPathAtDistance';

interface Props {
  element: SVGElement;
  onClose: () => void;
}

const PADDING = 30;

function UnmemorizedBridgePanel({ element, onClose }: Props): React.JSX.Element {
  const {
    beambox: { photo_edit_panel: langPhoto },
    image_edit_panel: lang,
  } = useI18n();
  const forceUpdate = useForceUpdate();
  const [mode, setMode] = useState<'auto' | 'manual'>('manual');
  const [pathData, setPathData] = useState('');
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [bridgeWidth, setBridgeWidth] = useState(10); // 0.5
  const [bridgeGap, setBridgeGap] = useState(10);
  // only for display percentage, not for calculation
  const [zoomScale, setZoomScale] = useState(1);
  const [fitScreenDimension, setFitScreenDimension] = useState({ scale: 1, x: 0, y: 0 });
  const divRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleReset = useCallback(() => {
    // handleZoom(fitScreenDimension.scale);
  }, [fitScreenDimension]);

  const handleComplete = useCallback(() => {
    progressCaller.openNonstopProgress({ id: 'bridge-editing', message: langPhoto.processing });

    // add a frame to wait for re-render, otherwise the image might be blank or not updated
    requestAnimationFrame(() => {});
  }, [langPhoto]);

  const getPointerPosition = useCallback((event: paper.Event) => {
    const point = paper.view.getEventPoint(event);

    return point;
  }, []);

  const handleMouseDown = useCallback(
    (event: paper.MouseEvent) => {
      const { point } = event;

      paper.project.hitTest(point, {
        fill: false,
        match: (hit: paper.HitResult) => {
          console.log(hit.item.parent?.name);

          const circle = new paper.Path.Circle(point, 3);

          circle.fillColor = new paper.Color('red');

          if (hit.item.parent?.name === 'parentPath') {
            const path = hit.item as paper.Path;
            const newCompoundPath = cutPathAtDistance(path, point, bridgeWidth);

            console.log(newCompoundPath.pathData);

            setPathData(newCompoundPath.pathData);
          }

          return true;
        },
        stroke: true,
        tolerance: 30,
      });
    },
    [bridgeWidth],
  );

  const handleMouseMove = useCallback((event: paper.MouseEvent) => {
    // console.log(event.point);
  }, []);

  useEffect(() => {
    const inputPathData = element.getAttribute('d');

    if (!inputPathData?.trim()) return;

    const initialize = async () => {
      const { clientHeight, clientWidth } = divRef.current!;

      paper.setup(canvasRef.current!);
      paper.project.activate();
      paper.view.size.set(new paper.Size(clientWidth, clientHeight));

      const originalPath = new paper.CompoundPath(inputPathData);
      const {
        bounds: { center, height, width },
      } = originalPath;
      const scaleFactor = Math.min(1, (clientWidth - PADDING * 2) / width, (clientHeight - PADDING * 2) / height);

      console.log(center, height, width, scaleFactor);

      const newCenter = new paper.Point(
        Math.max(PADDING, width * scaleFactor),
        Math.max(PADDING, height * scaleFactor),
      );

      // paper.view.center = newCenter;

      // console.log(newCenter, paper.view.center);
      // paper.view.translate(newCenter);
      // const canvasSize = Math.min(paper.view.size.width, paper.view.size.height);
      // const targetSize = canvasSize * 0.8;
      // const scaleFactor = Math.min(targetSize / size.width, targetSize / size.height);

      // Store offset and scale for later
      setOffset({ x: center.x, y: center.y });
      setZoomScale(scaleFactor);

      // Create normalized path
      const normalizedPath = originalPath.clone();

      originalPath.remove();

      normalizedPath.scale(scaleFactor, center);
      normalizedPath.position = newCenter;
      normalizedPath.strokeColor = new paper.Color('black');
      normalizedPath.strokeWidth = 1;
      normalizedPath.name = 'parentPath';

      const circle = new paper.Path.Circle(newCenter, 3);

      circle.fillColor = new paper.Color('red');

      paper.view.center = newCenter;

      // Store normalized path data
      setPathData(normalizedPath.pathData);

      originalPath.remove();

      // Zoom to fit
      paper.view.zoom = 1;
    };

    initialize();

    // update stage dimensions according parent div
    const observer = new ResizeObserver((elements) => {
      if (!paper.view.isInserted()) return;

      elements.forEach(({ contentRect: { height, width } }) => {
        paper.project.view.size.set(new paper.Size(width, height));
        paper.project.view.requestUpdate();
      });
    });

    observer.observe(divRef.current!);

    return () => {
      observer.disconnect();
      paper.project.clear();
    };
    // eslint-disable-next-line hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!paper.tool) {
      new paper.Tool();
    }

    const { tool } = paper;

    tool.onMouseDown = handleMouseDown;
    tool.onMouseMove = handleMouseMove;
  }, [handleMouseDown, handleMouseMove]);

  useNewShortcutsScope();
  useEffect(() => {
    const subscribedShortcuts = [
      shortcuts.on(['Escape'], onClose, { isBlocking: true }),
      // shortcuts.on(['Fnkey+z'], handleHistoryChange('undo'), { isBlocking: true }),
      // shortcuts.on(['Shift+Fnkey+z'], handleHistoryChange('redo'), { isBlocking: true }),
      // shortcuts.on(['Fnkey-+', 'Fnkey-='], () => handleZoomByScale(1.2), {
      //   isBlocking: true,
      //   splitKey: '-',
      // }),
      // shortcuts.on(['Fnkey+-'], () => handleZoomByScale(0.8), { isBlocking: true }),
    ];

    return () => {
      subscribedShortcuts.forEach((unsubscribe) => unsubscribe());
    };
  }, [onClose]);

  return (
    <FullWindowPanel
      mobileTitle={lang.title}
      onClose={onClose}
      renderContents={() => (
        <>
          <Sider
            bridgeGap={bridgeGap}
            bridgeWidth={bridgeWidth}
            mode={mode}
            onClose={onClose}
            onComplete={handleComplete}
            setBridgeGap={setBridgeGap}
            setBridgeWidth={setBridgeWidth}
            setMode={setMode}
          />
          <Flex className={styles['w-100']} vertical>
            <TopBar
              handleHistoryChange={(() => {}) as any}
              handleReset={handleReset}
              handleZoomByScale={(() => {}) as any}
              history={{ index: 0, items: [] }}
              zoomScale={zoomScale}
            />
            <div className={styles['outer-container']}>
              <div className={styles.container} ref={divRef} style={{ cursor: 'crosshair' }}>
                <canvas className={styles.canvas} ref={canvasRef} />
              </div>
            </div>
          </Flex>
        </>
      )}
      renderMobileContents={() => null}
      renderMobileFixedContent={() => null}
    />
  );
}

const BridgePanel = memo(UnmemorizedBridgePanel);

export default BridgePanel;
