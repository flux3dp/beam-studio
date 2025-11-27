import React, { memo, useCallback, useContext, useMemo } from 'react';

import { match } from 'ts-pattern';

import FnWrapper from '@core/app/actions/beambox/svgeditor-function-wrapper';
import dialogCaller from '@core/app/actions/dialog-caller';
import LeftPanelButton from '@core/app/components/beambox/LeftPanel/components/LeftPanelButton';
import { showPassThrough } from '@core/app/components/pass-through';
import { CanvasContext } from '@core/app/contexts/CanvasContext';
import LeftPanelIcons from '@core/app/icons/left-panel/LeftPanelIcons';
import { useCameraPreviewStore } from '@core/app/stores/cameraPreview';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import { setMouseMode } from '@core/app/stores/canvas/utils/mouseMode';
import { handlePreviewClick } from '@core/app/stores/canvas/utils/previewMode';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import useI18n from '@core/helpers/useI18n';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { useChatStore } from '../../svg-editor/Chat/useChatStore';
import styles from '../index.module.scss';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

type ToolButtonProps = {
  className?: string;
  disabled?: boolean;
  icon: React.JSX.Element;
  id: string;
  label?: string;
  onClick: () => void;
  showBadge?: boolean;
  style?: React.CSSProperties;
};

const DrawingToolButtonGroup = ({ className }: { className: string }): React.JSX.Element => {
  const lang = useI18n();
  const tLeftPanel = lang.beambox.left_panel;
  const { hasPassthroughExtension } = useContext(CanvasContext);
  const { isChatShown, setIsChatShown } = useChatStore();
  const { isDrawing } = useCameraPreviewStore();
  const mouseMode = useCanvasStore((state) => state.mouseMode);
  const activeButton = useMemo(() => {
    return match(mouseMode)
      .with('pre_preview', 'preview', () => 'Preview')
      .with('text', 'textedit', () => 'Text')
      .with('rect', () => 'Rectangle')
      .with('ellipse', () => 'Ellipse')
      .with('polygon', () => 'Polygon')
      .with('line', () => 'Line')
      .with('path', 'pathedit', () => 'Pen')
      .otherwise(() => 'Cursor');
  }, [mouseMode]);

  const renderToolButton = ({
    className = undefined,
    disabled = false,
    icon,
    id,
    label = id,
    onClick,
    showBadge = false,
    style = undefined,
  }: ToolButtonProps) => (
    <LeftPanelButton
      active={activeButton === id}
      className={className}
      disabled={disabled}
      icon={icon}
      id={`left-${id}`}
      onClick={() => {
        svgCanvas?.clearSelection();
        onClick();
      }}
      showBadge={showBadge}
      style={style}
      title={label}
    />
  );

  const toggleBeamy = useCallback(() => {
    setIsChatShown(!isChatShown);
  }, [isChatShown, setIsChatShown]);

  return (
    <div className={className}>
      {renderToolButton({
        disabled: isDrawing,
        icon: <LeftPanelIcons.Camera />,
        id: 'Preview',
        label: lang.topbar.preview,
        onClick: async () => handlePreviewClick(),
      })}
      {renderToolButton({
        icon: <LeftPanelIcons.Cursor />,
        id: 'Cursor',
        label: `${tLeftPanel.label.cursor} (V)`,
        onClick: FnWrapper.useSelectTool,
      })}
      {renderToolButton({
        icon: <LeftPanelIcons.Photo />,
        id: 'Photo',
        label: `${tLeftPanel.label.photo} (I)`,
        onClick: FnWrapper.importImage,
      })}
      {renderToolButton({
        icon: <LeftPanelIcons.Text />,
        id: 'Text',
        label: `${tLeftPanel.label.text} (T)`,
        onClick: () => setMouseMode('text'),
      })}
      {renderToolButton({
        icon: <LeftPanelIcons.Element />,
        id: 'Element',
        label: `${tLeftPanel.label.elements} (E)`,
        onClick: () => dialogCaller.showElementPanel(FnWrapper.useSelectTool),
      })}
      {renderToolButton({
        icon: <LeftPanelIcons.Rect />,
        id: 'Rectangle',
        label: `${tLeftPanel.label.rect} (M)`,
        onClick: () => setMouseMode('rect'),
      })}
      {renderToolButton({
        icon: <LeftPanelIcons.Oval />,
        id: 'Ellipse',
        label: `${tLeftPanel.label.oval} (C)`,
        onClick: () => setMouseMode('ellipse'),
      })}
      {renderToolButton({
        icon: <LeftPanelIcons.Polygon />,
        id: 'Polygon',
        label: tLeftPanel.label.polygon,
        onClick: () => setMouseMode('polygon'),
      })}
      {renderToolButton({
        icon: <LeftPanelIcons.Line />,
        id: 'Line',
        label: `${tLeftPanel.label.line} (\\)`,
        onClick: () => setMouseMode('line'),
      })}
      {renderToolButton({
        icon: <LeftPanelIcons.Draw />,
        id: 'Pen',
        label: `${tLeftPanel.label.pen} (P)`,
        onClick: () => setMouseMode('path'),
      })}
      {hasPassthroughExtension &&
        renderToolButton({
          icon: <LeftPanelIcons.PassThrough />,
          id: 'PassThrough',
          label: tLeftPanel.label.pass_through,
          onClick: () => showPassThrough(FnWrapper.useSelectTool),
        })}

      <div className={styles.separator} />

      {renderToolButton({
        className: styles.beamy,
        icon: <LeftPanelIcons.Beamy />,
        id: 'Beamy',
        onClick: toggleBeamy,
        style: { color: isChatShown ? '#1890ff' : undefined },
      })}
    </div>
  );
};

export default memo(DrawingToolButtonGroup);
