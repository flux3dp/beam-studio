import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Flex } from 'antd';
import paper from 'paper';
import { pipe, tap } from 'remeda';
import { match } from 'ts-pattern';

import { dpmm } from '@core/app/actions/beambox/constant';
import FullWindowPanel from '@core/app/widgets/FullWindowPanel/FullWindowPanel';
import { handleChangePathDataCommand } from '@core/helpers/BridgePanel/handleChangePathDataCommand';
import { usePaperCanvas } from '@core/helpers/hooks/paperjs/usePaperCanvas';
import useNewShortcutsScope from '@core/helpers/hooks/useNewShortcutsScope';
import shortcuts from '@core/helpers/shortcuts';
import useI18n from '@core/helpers/useI18n';

import { useHistory } from './hooks/useHistory';
import styles from './index.module.scss';
import Sider from './Sider';
import TopBar from './TopBar';
import { cutPathAtDistance } from './utils/cutPathAtDistance';

interface Props {
  bbox: DOMRect;
  element: SVGElement;
  onClose: () => void;
}

const PADDING = 30;
const TARGET_PATH_NAME = 'parentPath';

function UnmemorizedBridgePanel({ bbox, element, onClose }: Props): React.JSX.Element {
  const { image_edit_panel: lang } = useI18n();
  const { history, push, redo, set, undo } = useHistory({ hasUndid: false, index: 0, items: [{ pathData: [] }] });
  const [mode, setMode] = useState<'auto' | 'manual'>('manual');
  const [pathData, setPathData] = useState(Array.of<string>());
  const [isPathDataChanged, setIsPathDataChanged] = useState(false);
  const [bridgeWidth, setBridgeWidth] = useState(10); // 0.5
  const [bridgeGap, setBridgeGap] = useState(10);
  // only for display percentage, not for calculation
  const [zoomScale, setZoomScale] = useState(1);
  const [fitScreenDimension, setFitScreenDimension] = useState({ scale: 1, x: 0, y: 0 });
  const divRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragDeltaRef = useRef(new paper.Point(0, 0));

  const { handleWheel, handleZoom, handleZoomByScale, isDraggable, isDragging } = usePaperCanvas({
    maxScale: 5,
    onScaleChanged: setZoomScale,
  });

  const cursorStyle = useMemo(
    () =>
      match({ isDraggable, isDragging })
        .with({ isDraggable: true, isDragging: true }, () => ({ cursor: 'grabbing' }))
        .with({ isDraggable: true, isDragging: false }, () => ({ cursor: 'grab' }))
        .otherwise(() => ({ cursor: 'crosshair' })),
    [isDragging, isDraggable],
  );

  const handlePushHistory = useCallback(() => {
    if (!isPathDataChanged) return;

    push({ pathData });
    setIsPathDataChanged(false);
  }, [push, pathData, isPathDataChanged]);
  const handleHistoryChange = useCallback(
    (action: 'redo' | 'undo') => () => {
      const { pathData } = action === 'undo' ? undo() : redo();

      setPathData(pathData);
      setIsPathDataChanged(false);
    },
    [undo, redo],
  );
  const handleReset = useCallback(() => {
    handleZoom(fitScreenDimension.scale);
    paper.view.center = new paper.Point(fitScreenDimension);
  }, [fitScreenDimension, handleZoom]);

  const handleComplete = useCallback(
    () =>
      pipe(
        paper.project.getItem({ name: TARGET_PATH_NAME }) as paper.CompoundPath,
        tap((item) => item.fitBounds(bbox)),
        ({ pathData }) => handleChangePathDataCommand(element as unknown as SVGPathElement, pathData),
        onClose,
      ),
    [bbox, element, onClose],
  );

  const handleMouseDown = useCallback(
    (event: paper.ToolEvent) => {
      const { point } = event;

      if (isDraggable || isDragging || (event as any).event.button !== 0 || mode !== 'manual') return;

      paper.project.hitTest(point, {
        fill: false,
        match: (hit: paper.HitResult) => {
          // ensure the path is the target compound path's child
          if (hit.item.parent?.name === TARGET_PATH_NAME) {
            const path = hit.item as paper.Path;
            // bridgeWidth is in mm, convert to dpmm
            // divide by 2 to get radius of the circle to cut path
            const newCompoundPath = cutPathAtDistance(path, point, (bridgeWidth * dpmm) / 2);

            setPathData((prev) => prev.concat(newCompoundPath.pathData) || [newCompoundPath.pathData]);
            setIsPathDataChanged(true);
          }

          // always return true to prevent the hit test keep searching
          return true;
        },
        segments: true,
        stroke: true,
        tolerance: 30,
      });
    },
    [bridgeWidth, isDraggable, isDragging, mode],
  );
  const handleMouseDrag = useCallback(
    (event: paper.ToolEvent) => {
      if (!isDragging || !isDraggable) return;

      paper.view.translate(event.delta.subtract(dragDeltaRef.current));
      dragDeltaRef.current = dragDeltaRef.current.subtract(event.delta);
    },
    [isDraggable, isDragging],
  );

  useEffect(() => {
    const inputPathData = element.getAttribute('d');

    if (!inputPathData?.trim()) return;

    const initialize = async () => {
      const { clientHeight, clientWidth } = divRef.current!;

      paper.setup(canvasRef.current!);
      paper.project.activate();
      paper.view.size.set(new paper.Size(clientWidth, clientHeight));

      const targetPath = new paper.CompoundPath(inputPathData);
      const {
        bounds: { height, width },
      } = targetPath;
      const scale = Math.min(1, (clientWidth - PADDING * 2) / width, (clientHeight - PADDING * 2) / height);
      const newCenter = new paper.Point(Math.max(PADDING, width * scale), Math.max(PADDING, height * scale));

      setFitScreenDimension({ scale, x: newCenter.x, y: newCenter.y });
      setZoomScale(scale);

      targetPath.position = newCenter;
      targetPath.strokeColor = new paper.Color('black');
      targetPath.strokeWidth = 1;
      targetPath.name = TARGET_PATH_NAME;

      paper.view.center = newCenter;
      paper.view.zoom = scale;

      // Store normalized path data
      setPathData([targetPath.pathData]);
      set({ pathData: [targetPath.pathData] });
    };

    initialize();

    // update stage dimensions according parent div
    const observer = new ResizeObserver((elements) => {
      // if the paper view is not inserted, do nothing
      if (!paper.view.isInserted()) return;

      elements.forEach(({ contentRect: { height, width } }) => {
        paper.view.size.set(new paper.Size(width, height));
        // to prevent the canvas overlap with the bottom of the screen
        // this is a workaround for the paperjs bug,
        // `5` is the minimum value to prevent this situation
        paper.view.viewSize.set(new paper.Size(width, height - 5));
      });
    });

    observer.observe(divRef.current!);

    return () => {
      observer.disconnect();
      paper.project.clear();
    };
    // only run once
    // eslint-disable-next-line hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!paper.tool) new paper.Tool();

    const { tool } = paper;

    tool.onMouseDown = handleMouseDown;
    tool.onMouseUp = handlePushHistory;
    tool.onMouseDrag = handleMouseDrag;
  }, [handleMouseDown, handleMouseDrag, handlePushHistory]);

  useEffect(() => {
    if (paper.project.isEmpty()) return;

    const path = paper.project.getItem({ name: TARGET_PATH_NAME }) as paper.CompoundPath;

    path.pathData = pathData.at(-1)!;
  }, [pathData]);

  useNewShortcutsScope();
  useEffect(() => {
    const subscribedShortcuts = [
      shortcuts.on(['Escape'], onClose, { isBlocking: true }),
      shortcuts.on(['Fnkey+z'], handleHistoryChange('undo'), { isBlocking: true }),
      shortcuts.on(['Shift+Fnkey+z'], handleHistoryChange('redo'), { isBlocking: true }),
      shortcuts.on(['Fnkey-+', 'Fnkey-='], () => handleZoomByScale(1.2), { isBlocking: true, splitKey: '-' }),
      shortcuts.on(['Fnkey+-'], () => handleZoomByScale(0.8), { isBlocking: true }),
    ];

    return () => {
      subscribedShortcuts.forEach((unsubscribe) => unsubscribe());
    };
  }, [handleHistoryChange, handleZoomByScale, onClose]);

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
              handleHistoryChange={handleHistoryChange}
              handleReset={handleReset}
              handleZoomByScale={handleZoomByScale}
              history={history}
              zoomScale={zoomScale}
            />
            <div className={styles['outer-container']}>
              <div className={styles.container} ref={divRef} style={cursorStyle}>
                <canvas className={styles.canvas} onWheel={handleWheel as any} ref={canvasRef} />
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
