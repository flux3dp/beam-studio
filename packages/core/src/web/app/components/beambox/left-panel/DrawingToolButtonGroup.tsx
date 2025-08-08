import React, { memo, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { InstagramOutlined } from '@ant-design/icons';

import FnWrapper from '@core/app/actions/beambox/svgeditor-function-wrapper';
import curveEngravingModeController from '@core/app/actions/canvas/curveEngravingModeController';
import dialogCaller from '@core/app/actions/dialog-caller';
import LeftPanelButton from '@core/app/components/beambox/left-panel/LeftPanelButton';
import { showPassThrough } from '@core/app/components/pass-through';
import { getAddOnInfo } from '@core/app/constants/addOn';
import { getSocialMedia } from '@core/app/constants/social-media-constants';
import { CanvasContext } from '@core/app/contexts/CanvasContext';
import LeftPanelIcons from '@core/app/icons/left-panel/LeftPanelIcons';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { getCurrentUser } from '@core/helpers/api/flux-id';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import isDev from '@core/helpers/is-dev';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { useChatStore } from '../svg-editor/Chat/useChatStore';

import styles from './LeftPanel.module.scss';

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
  const { changeToPreviewMode, hasPassthroughExtension, selectedDevice, setupPreviewMode } = useContext(CanvasContext);
  const { isChatShown, setIsChatShown } = useChatStore();
  const workarea = useDocumentStore((state) => state.workarea);
  const addOnInfo = getAddOnInfo(workarea);
  const isRotary = useDocumentStore((state) => state.rotary_mode) && Boolean(addOnInfo.rotary);
  const isAutoFeeder = useDocumentStore((state) => state['auto-feeder']) && Boolean(addOnInfo.autoFeeder);
  const isPassThrough = useDocumentStore((state) => state['pass-through']) && Boolean(addOnInfo.passThrough);
  const isCurveEngravingDisabled = useMemo(
    () => isAutoFeeder || isRotary || isPassThrough,
    [isAutoFeeder, isRotary, isPassThrough],
  );
  const [activeButton, setActiveButton] = useState('Cursor');
  const isSubscribed = getCurrentUser()?.info?.subscription?.is_valid;
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
          changeToPreviewMode();
          setupPreviewMode();
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
        icon: <LeftPanelIcons.Cloud />,
        id: 'MyCloud',
        label: tLeftPanel.label.my_cloud,
        onClick: () => dialogCaller.showMyCloud(FnWrapper.useSelectTool),
        showBadge: isSubscribed,
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
      {([selectedDevice?.model, workarea].includes('fbb2') || isDev()) &&
        renderToolButton({
          disabled: isCurveEngravingDisabled,
          icon: <LeftPanelIcons.CurveEngrave />,
          id: 'curve-engrave',
          label: isCurveEngravingDisabled ? lang.global.mode_conflict : tLeftPanel.label.curve_engraving.title,
          onClick: () => curveEngravingModeController.start(),
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
      {renderToolButton({
        icon: <InstagramOutlined />,
        id: 'Instagram',
        onClick: () => browser.open(getSocialMedia().instagram.link),
        shouldSetActive: false,
      })}
      {renderToolButton({
        icon: <LeftPanelIcons.DesignMarket />,
        id: 'DesignMarket',
        onClick: () => browser.open(lang.topbar.menu.link.design_market),
        shouldSetActive: false,
      })}
    </div>
  );
};

export default memo(DrawingToolButtonGroup);
