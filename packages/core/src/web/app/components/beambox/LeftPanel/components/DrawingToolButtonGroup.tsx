import React, { memo, useContext, useMemo } from 'react';

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
import { handlePreviewClick } from '@core/helpers/device/camera/previewMode';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import useI18n from '@core/helpers/useI18n';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

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
  const t = lang.beambox.left_panel;
  const { hasPassthroughExtension } = useContext(CanvasContext);
  const { isDrawing, isStarting } = useCameraPreviewStore();
  const { drawerMode, mouseMode, toggleDrawerMode } = useCanvasStore();
  const activeButton = useMemo(
    () =>
      match(mouseMode)
        .with('pre_preview', 'preview', () => 'Preview')
        .with('text', 'textedit', () => 'Text')
        .with('rect', () => 'Rectangle')
        .with('ellipse', () => 'Ellipse')
        .with('polygon', () => 'Polygon')
        .with('line', () => 'Line')
        .with('path', 'pathedit', () => 'Pen')
        .otherwise(() => 'Cursor'),
    [mouseMode],
  );

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

  return (
    <div className={className}>
      {renderToolButton({
        disabled: isDrawing || isStarting,
        icon: <LeftPanelIcons.Camera />,
        id: 'Preview',
        label: t.label.preview,
        onClick: async () => handlePreviewClick(),
      })}
      {renderToolButton({
        icon: <LeftPanelIcons.Cursor />,
        id: 'Cursor',
        label: `${t.label.cursor} (V)`,
        onClick: FnWrapper.useSelectTool,
      })}
      {renderToolButton({
        icon: <LeftPanelIcons.Photo />,
        id: 'Photo',
        label: `${t.label.photo} (I)`,
        onClick: FnWrapper.importImage,
      })}
      {renderToolButton({
        icon: <LeftPanelIcons.Text />,
        id: 'Text',
        label: `${t.label.text} (T)`,
        onClick: () => setMouseMode('text'),
      })}
      {renderToolButton({
        icon: <LeftPanelIcons.Element />,
        id: 'Element',
        label: `${t.label.elements} (E)`,
        // TODO: change elementPanel into a Drawer act like AiGenerate and Chat
        onClick: () => dialogCaller.showElementPanel(FnWrapper.useSelectTool),
      })}
      {renderToolButton({
        icon: <LeftPanelIcons.Rect />,
        id: 'Rectangle',
        label: `${t.label.rect} (M)`,
        onClick: () => setMouseMode('rect'),
      })}
      {renderToolButton({
        icon: <LeftPanelIcons.Oval />,
        id: 'Ellipse',
        label: `${t.label.oval} (C)`,
        onClick: () => setMouseMode('ellipse'),
      })}
      {renderToolButton({
        icon: <LeftPanelIcons.Polygon />,
        id: 'Polygon',
        label: t.label.polygon,
        onClick: () => setMouseMode('polygon'),
      })}
      {renderToolButton({
        icon: <LeftPanelIcons.Line />,
        id: 'Line',
        label: `${t.label.line} (\\)`,
        onClick: () => setMouseMode('line'),
      })}
      {renderToolButton({
        icon: <LeftPanelIcons.Draw />,
        id: 'Pen',
        label: `${t.label.pen} (P)`,
        onClick: () => setMouseMode('path'),
      })}
      {renderToolButton({
        icon: <LeftPanelIcons.AiGenerate />,
        id: 'AiGenerate',
        label: lang.beambox.ai_generate.header.title,
        onClick: () => toggleDrawerMode('ai-generate'),
        style: { color: drawerMode === 'ai-generate' ? '#000000' : undefined },
      })}
      {hasPassthroughExtension &&
        renderToolButton({
          icon: <LeftPanelIcons.PassThrough />,
          id: 'PassThrough',
          label: t.label.pass_through,
          onClick: () => showPassThrough(FnWrapper.useSelectTool),
        })}

      <div className={styles.separator} />

      {renderToolButton({
        className: styles.beamy,
        icon: <LeftPanelIcons.Beamy />,
        id: 'Beamy',
        onClick: () => toggleDrawerMode('ai-chat'),
        style: { color: drawerMode === 'ai-chat' ? '#1890ff' : undefined },
      })}
    </div>
  );
};

export default memo(DrawingToolButtonGroup);
