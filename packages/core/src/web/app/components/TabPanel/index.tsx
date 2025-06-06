import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Flex } from 'antd';
import paper from 'paper';
import { pipe, tap } from 'remeda';
import { match } from 'ts-pattern';

import { dpmm } from '@core/app/actions/beambox/constant';
import FullWindowPanel from '@core/app/widgets/FullWindowPanel/FullWindowPanel';
import { usePaperCanvas } from '@core/helpers/hooks/paperjs/usePaperCanvas';
import useNewShortcutsScope from '@core/helpers/hooks/useNewShortcutsScope';
import shortcuts from '@core/helpers/shortcuts';
import { handleChangePathDataCommand } from '@core/helpers/TabPanel/handleChangePathDataCommand';
import useI18n from '@core/helpers/useI18n';
import type { IBatchCommand } from '@core/interfaces/IHistory';

import { useHistory } from './hooks/useHistory';
import styles from './index.module.scss';
import Sider from './Sider';
import TopBar from './TopBar';
import { TARGET_PATH_NAME } from './utils/constant';
import { cutPathAtPoint } from './utils/cutPathAtPoint';
import { cutPathByGap } from './utils/cutPathByGap';
import { drawPerpendicularLineOnPath } from './utils/drawPerpendicularLineOnPath';
import { getClosestHit } from './utils/getClosestHit';
import { removePerpendicularLineIfExist } from './utils/removePerpendicularLineIfExist';

interface Props {
  bbox: DOMRect;
  command?: IBatchCommand;
  element: SVGElement;
  onClose: () => void;
}

const PADDING = 30;

function UnmemorizedTabPanel({ bbox, command, element, onClose }: Props): React.JSX.Element {
  const { tab_panel: lang } = useI18n();
  const { history, push, redo, set, undo } = useHistory({ index: 0, items: [{ pathData: [] }] });
  const [mode, setMode] = useState<'auto' | 'manual'>('manual');
  const [pathData, setPathData] = useState(Array.of<string>());
  const [width, setWidth] = useState(0.5);
  const [gap, setGap] = useState(10);
  // only for display percentage, not for calculation
  const [zoomScale, setZoomScale] = useState(1);
  const [fitScreenDimension, setFitScreenDimension] = useState({ scale: 1, x: 0, y: 0 });
  const divRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragDeltaRef = useRef(new paper.Point(0, 0));

  const { handleWheel, handleZoom, handleZoomByScale, isDraggable, isDragging } = usePaperCanvas({
    element: canvasRef.current ?? (document as unknown as HTMLElement),
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

  const handleHistoryChange = useCallback(
    (action: 'redo' | 'undo') => () => {
      const { pathData } = action === 'undo' ? undo() : redo();

      setPathData(pathData);
    },
    [undo, redo],
  );

  const handleReset = useCallback(() => {
    handleZoom(fitScreenDimension.scale);
    paper.view.center = new paper.Point(fitScreenDimension);
  }, [fitScreenDimension, handleZoom]);
  const handleOnClose = useCallback(
    (isCompleted = false) => {
      if (!isCompleted) {
        command?.doUnapply();
      }

      onClose();
    },
    [command, onClose],
  );
  const handleComplete = useCallback(
    () =>
      pipe(
        paper.project.getItem({ name: TARGET_PATH_NAME }) as paper.CompoundPath,
        tap((item) => item.fitBounds(bbox)),
        ({ pathData: d }) =>
          handleChangePathDataCommand({ d, element: element as unknown as SVGPathElement, subCommand: command }),
        () => handleOnClose(true),
      ),
    [bbox, command, element, handleOnClose],
  );

  const handleCutPathByGap = useCallback(() => {
    const newCompoundPath = cutPathByGap({ gap: gap * dpmm, width: width * dpmm });
    const newPathData = pathData.concat(newCompoundPath.pathData);

    setPathData(newPathData);
    push({ pathData: newPathData });
  }, [gap, pathData, push, width]);

  const handleMouseDown = useCallback(
    (event: paper.ToolEvent) => {
      const { point } = event;

      if (isDraggable || isDragging || (event as any).event.button !== 0 || mode !== 'manual') return;

      removePerpendicularLineIfExist();

      const closestHit = getClosestHit(point);

      if (closestHit) {
        const path = closestHit.item as paper.Path;
        const newCompoundPath = cutPathAtPoint(path, point, width * dpmm);

        if (newCompoundPath) {
          const newPathData = pathData.concat(newCompoundPath.pathData);

          setPathData(newPathData);
          push({ pathData: newPathData });
        }
      }
    },
    [isDraggable, isDragging, mode, width, push, pathData],
  );
  const handleMouseMove = useCallback(
    (event: paper.ToolEvent) => {
      const { point } = event;

      if (isDraggable || isDragging || mode !== 'manual') return;

      removePerpendicularLineIfExist();

      const closestHit = getClosestHit(point);

      if (closestHit) {
        const path = closestHit.item as paper.Path;

        drawPerpendicularLineOnPath(path, point, width * dpmm, zoomScale);
      }
    },
    [isDraggable, isDragging, mode, width, zoomScale],
  );
  const handleMouseDrag = useCallback(
    (event: paper.ToolEvent) => {
      if (!isDragging || !isDraggable) return;

      removePerpendicularLineIfExist();

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
    tool.onMouseDrag = handleMouseDrag;
    tool.onMouseMove = handleMouseMove;
  }, [handleMouseDown, handleMouseDrag, handleMouseMove]);

  useEffect(() => {
    if (paper.project.isEmpty()) return;

    const path = paper.project.getItem({ name: TARGET_PATH_NAME }) as paper.CompoundPath;

    path.pathData = pathData.at(-1)!;
  }, [pathData]);

  useNewShortcutsScope();
  useEffect(() => {
    const subscribedShortcuts = [
      shortcuts.on(['Escape'], () => handleOnClose(), { isBlocking: true }),
      shortcuts.on(['Fnkey+z'], handleHistoryChange('undo'), { isBlocking: true }),
      shortcuts.on(['Shift+Fnkey+z'], handleHistoryChange('redo'), { isBlocking: true }),
      shortcuts.on(['Fnkey-+', 'Fnkey-='], () => handleZoomByScale(1.2), { isBlocking: true, splitKey: '-' }),
      shortcuts.on(['Fnkey+-'], () => handleZoomByScale(0.8), { isBlocking: true }),
    ];

    return () => {
      subscribedShortcuts.forEach((unsubscribe) => unsubscribe());
    };
  }, [handleHistoryChange, handleZoomByScale, handleOnClose]);

  return (
    <FullWindowPanel
      mobileTitle={lang.title}
      onClose={() => handleOnClose()}
      renderContents={() => (
        <>
          <Sider
            gap={gap}
            handleCutPathByGap={handleCutPathByGap}
            mode={mode}
            onClose={() => handleOnClose()}
            onComplete={handleComplete}
            setGap={setGap}
            setMode={setMode}
            setWidth={setWidth}
            width={width}
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

const TabPanel = memo(UnmemorizedTabPanel);

export default TabPanel;
