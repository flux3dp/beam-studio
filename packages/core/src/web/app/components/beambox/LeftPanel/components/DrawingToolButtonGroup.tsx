import React, { memo, use, useMemo, useRef } from 'react';

import { match } from 'ts-pattern';

import FnWrapper from '@core/app/actions/beambox/svgeditor-function-wrapper';
import LeftPanelButton from '@core/app/components/beambox/LeftPanel/components/LeftPanelButton';
import LeftPanelButtonGroup from '@core/app/components/beambox/LeftPanel/components/LeftPanelButtonGroup';
import { showPassThrough } from '@core/app/components/pass-through';
import { CanvasContext } from '@core/app/contexts/CanvasContext';
import GeneratorIcons from '@core/app/icons/generator/GeneratorIcons';
import LeftPanelIcons from '@core/app/icons/left-panel/LeftPanelIcons';
import { useCameraPreviewStore } from '@core/app/stores/cameraPreview';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import { setMouseMode } from '@core/app/stores/canvas/utils/mouseMode';
import selectionManager from '@core/app/svgedit/selection';
import { endPreviewMode, handlePreviewClick } from '@core/helpers/device/camera/previewMode';
import useDidUpdateEffect from '@core/helpers/hooks/useDidUpdateEffect';
import { useInnerEngravingActive } from '@core/helpers/innerEngraving';
import useI18n from '@core/helpers/useI18n';

import styles from '../index.module.scss';

type ToolButtonProps = {
  className?: string;
  disabled?: boolean;
  icon: React.JSX.Element;
  id: string;
  label?: string;
  onClick: () => void;
  showBadge?: boolean;
  style?: React.CSSProperties;
  supportedIn3D?: boolean;
};

const DrawingToolButtonGroup = ({ className }: { className: string }): React.JSX.Element => {
  const lang = useI18n();
  const t = lang.beambox.left_panel;
  const { hasPassthroughExtension } = use(CanvasContext);
  const { isDrawing, isStarting } = useCameraPreviewStore();
  const { drawerMode, mouseMode, setDrawerMode, toggleDrawerMode } = useCanvasStore();
  const activeButton = useMemo(
    () =>
      match(mouseMode)
        .with('pre_preview', 'preview', () => 'Preview')
        .with('text', 'textedit', 'fit-text', () => 'Text')
        .with('rect', () => 'Rectangle')
        .with('ellipse', () => 'Ellipse')
        .with('polygon', () => 'Polygon')
        .with('line', () => 'Line')
        .with('path', 'pathedit', () => 'Pen')
        .otherwise(() => 'Cursor'),
    [mouseMode],
  );
  const isInnerEngravingMode = useInnerEngravingActive();
  const modeRef = useRef(isInnerEngravingMode);

  useDidUpdateEffect(() => {
    if (!isInnerEngravingMode || modeRef.current === isInnerEngravingMode) return;

    modeRef.current = isInnerEngravingMode;

    setDrawerMode('none');
    endPreviewMode();
    // eslint-disable-next-line hooks/rules-of-hooks
    FnWrapper.useSelectTool();
  }, [isInnerEngravingMode]);

  const renderToolButton = ({
    className = undefined,
    disabled = false,
    icon,
    id,
    label = id,
    onClick,
    showBadge = false,
    style = undefined,
    supportedIn3D = false,
  }: ToolButtonProps) =>
    isInnerEngravingMode && !supportedIn3D ? null : (
      <LeftPanelButton
        active={activeButton === id}
        className={className}
        disabled={disabled}
        icon={icon}
        id={`left-${id}`}
        onClick={() => {
          selectionManager.clearSelection();
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
        supportedIn3D: true,
      })}
      {renderToolButton({
        icon: <LeftPanelIcons.Photo />,
        id: 'Photo',
        label: `${t.label.photo} (I)`,
        onClick: FnWrapper.importImage,
        supportedIn3D: true,
      })}
      {!isInnerEngravingMode && (
        <LeftPanelButtonGroup
          active={activeButton === 'Text' || activeButton === 'FitText'}
          id="left-Text"
          options={[
            {
              icon: <LeftPanelIcons.Text />,
              id: 'Text',
              label: t.label.text,
              onClick: () => {
                selectionManager.clearSelection();
                setMouseMode('text');
              },
              title: t.label.text,
            },
            {
              icon: <LeftPanelIcons.TextBox />,
              id: 'FitText',
              label: t.label.fit_text,
              onClick: () => {
                selectionManager.clearSelection();
                setMouseMode('fit-text');
              },
            },
          ]}
          shortcut="T"
        />
      )}
      {renderToolButton({
        icon: <LeftPanelIcons.Element />,
        id: 'Element',
        label: `${t.label.elements} (E)`,
        onClick: () => toggleDrawerMode('element-panel'),
        style: { color: drawerMode === 'element-panel' ? '#000000' : undefined },
        supportedIn3D: true,
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
      {renderToolButton({
        icon: <GeneratorIcons.Generator />,
        id: 'Generator',
        label: lang.generators.title,
        onClick: () => toggleDrawerMode('generator'),
        style: { color: drawerMode === 'generator' ? '#000000' : undefined },
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
        supportedIn3D: true,
      })}
    </div>
  );
};

export default memo(DrawingToolButtonGroup);
