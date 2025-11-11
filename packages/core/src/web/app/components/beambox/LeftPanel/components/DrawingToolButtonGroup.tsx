import React, { memo, useCallback, useContext, useEffect, useState } from 'react';

import FnWrapper from '@core/app/actions/beambox/svgeditor-function-wrapper';
import dialogCaller from '@core/app/actions/dialog-caller';
import LeftPanelButton from '@core/app/components/beambox/LeftPanel/components/LeftPanelButton';
import { showPassThrough } from '@core/app/components/pass-through';
import { CanvasContext } from '@core/app/contexts/CanvasContext';
import LeftPanelIcons from '@core/app/icons/left-panel/LeftPanelIcons';
import { startBackgroundPreviewMode } from '@core/app/stores/canvas/utils/previewMode';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
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
  shouldSetActive?: boolean;
  showBadge?: boolean;
  style?: React.CSSProperties;
};

const drawingToolEventEmitter = eventEmitterFactory.createEventEmitter('drawing-tool');

const DrawingToolButtonGroup = ({ className }: { className: string }): React.JSX.Element => {
  const lang = useI18n();
  const tLeftPanel = lang.beambox.left_panel;
  const { hasPassthroughExtension } = useContext(CanvasContext);
  const { isChatShown, setIsChatShown } = useChatStore();
  const [activeButton, setActiveButton] = useState('Cursor');
  const renderToolButton = ({
    className = undefined,
    disabled = false,
    icon,
    id,
    label = id,
    onClick,
    shouldSetActive = true,
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
        if (shouldSetActive) setActiveButton(id);

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

    if (isChatShown) setActiveButton('Cursor');
  }, [isChatShown, setIsChatShown]);

  useEffect(() => {
    drawingToolEventEmitter.on('SET_ACTIVE_BUTTON', setActiveButton);

    return () => {
      drawingToolEventEmitter.removeListener('SET_ACTIVE_BUTTON');
    };
  }, []);

  return (
    <div className={className}>
      {renderToolButton({
        icon: <LeftPanelIcons.Camera />,
        id: 'Preview',
        label: lang.topbar.preview,
        onClick: () => {
          // TODO: long press for normal mode
          startBackgroundPreviewMode();

          // changeToPreviewMode();
          // setupPreviewMode();
        },
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
        onClick: FnWrapper.insertText,
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
        onClick: FnWrapper.insertRectangle,
      })}
      {renderToolButton({
        icon: <LeftPanelIcons.Oval />,
        id: 'Ellipse',
        label: `${tLeftPanel.label.oval} (C)`,
        onClick: FnWrapper.insertEllipse,
      })}
      {renderToolButton({
        icon: <LeftPanelIcons.Polygon />,
        id: 'Polygon',
        label: tLeftPanel.label.polygon,
        onClick: FnWrapper.insertPolygon,
      })}
      {renderToolButton({
        icon: <LeftPanelIcons.Line />,
        id: 'Line',
        label: `${tLeftPanel.label.line} (\\)`,
        onClick: FnWrapper.insertLine,
      })}
      {renderToolButton({
        icon: <LeftPanelIcons.Draw />,
        id: 'Pen',
        label: `${tLeftPanel.label.pen} (P)`,
        onClick: FnWrapper.insertPath,
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
        shouldSetActive: false,
        style: { color: isChatShown ? '#1890ff' : undefined },
      })}
    </div>
  );
};

export default memo(DrawingToolButtonGroup);
