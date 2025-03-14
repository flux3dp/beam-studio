import React, { memo, useContext, useEffect, useMemo, useState } from 'react';

import { InstagramOutlined } from '@ant-design/icons';

import FnWrapper from '@core/app/actions/beambox/svgeditor-function-wrapper';
import curveEngravingModeController from '@core/app/actions/canvas/curveEngravingModeController';
import dialogCaller from '@core/app/actions/dialog-caller';
import LeftPanelButton from '@core/app/components/beambox/left-panel/LeftPanelButton';
import { showPassThrough } from '@core/app/components/pass-through';
import { getSupportInfo } from '@core/app/constants/add-on';
import { getSocialMedia } from '@core/app/constants/social-media-constants';
import { CanvasContext } from '@core/app/contexts/CanvasContext';
import LeftPanelIcons from '@core/app/icons/left-panel/LeftPanelIcons';
import { getCurrentUser } from '@core/helpers/api/flux-id';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import useBeamboxPreference from '@core/helpers/hooks/useBeamboxPreference';
import isDev from '@core/helpers/is-dev';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import styles from './LeftPanel.module.scss';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

const eventEmitter = eventEmitterFactory.createEventEmitter('drawing-tool');

const DrawingToolButtonGroup = ({ className }: { className: string }): React.JSX.Element => {
  const lang = useI18n();
  const tLeftPanel = lang.beambox.left_panel;
  const { changeToPreviewMode, hasPassthroughExtension, selectedDevice, setupPreviewMode } = useContext(CanvasContext);
  const workarea = useBeamboxPreference('workarea');
  const supportInfo = getSupportInfo(workarea);
  const isRotary = useBeamboxPreference('rotary_mode') && Boolean(supportInfo.rotary);
  const isAutoFeeder = useBeamboxPreference('auto-feeder') && Boolean(supportInfo.autoFeeder);
  const isPassThrough = useBeamboxPreference('pass-through') && supportInfo.passThrough;
  const isCurveEngravingDisabled = useMemo(
    () => isAutoFeeder || isRotary || isPassThrough,
    [isAutoFeeder, isRotary, isPassThrough],
  );
  const [activeButton, setActiveButton] = useState('Cursor');
  const isSubscribed = getCurrentUser()?.info?.subscription?.is_valid;
  const renderToolButton = (
    id: string,
    icon: React.JSX.Element,
    label: string,
    onClick: () => void,
    showBadge = false,
    disabled = false,
  ) => (
    <LeftPanelButton
      active={activeButton === id}
      disabled={disabled}
      icon={icon}
      id={`left-${id}`}
      onClick={() => {
        setActiveButton(id);
        svgCanvas?.clearSelection();
        onClick();
      }}
      showBadge={showBadge}
      title={label}
    />
  );

  useEffect(() => {
    eventEmitter.on('SET_ACTIVE_BUTTON', setActiveButton);

    return () => {
      eventEmitter.removeListener('SET_ACTIVE_BUTTON');
    };
  }, []);

  return (
    <div className={className}>
      {renderToolButton('Preview', <LeftPanelIcons.Camera />, lang.topbar.preview, () => {
        changeToPreviewMode();
        setupPreviewMode();
      })}
      {renderToolButton('Cursor', <LeftPanelIcons.Cursor />, `${tLeftPanel.label.cursor} (V)`, FnWrapper.useSelectTool)}
      {renderToolButton('Photo', <LeftPanelIcons.Photo />, `${tLeftPanel.label.photo} (I)`, FnWrapper.importImage)}
      {renderToolButton(
        'MyCloud',
        <LeftPanelIcons.Cloud />,
        tLeftPanel.label.my_cloud,
        () => dialogCaller.showMyCloud(FnWrapper.useSelectTool),
        isSubscribed,
      )}
      {renderToolButton('Text', <LeftPanelIcons.Text />, `${tLeftPanel.label.text} (T)`, FnWrapper.insertText)}
      {renderToolButton('Element', <LeftPanelIcons.Element />, `${tLeftPanel.label.shapes} (E)`, () =>
        dialogCaller.showShapePanel(FnWrapper.useSelectTool),
      )}
      {renderToolButton(
        'Rectangle',
        <LeftPanelIcons.Rect />,
        `${tLeftPanel.label.rect} (M)`,
        FnWrapper.insertRectangle,
      )}
      {renderToolButton('Ellipse', <LeftPanelIcons.Oval />, `${tLeftPanel.label.oval} (C)`, FnWrapper.insertEllipse)}
      {renderToolButton('Polygon', <LeftPanelIcons.Polygon />, tLeftPanel.label.polygon, FnWrapper.insertPolygon)}
      {renderToolButton('Line', <LeftPanelIcons.Line />, `${tLeftPanel.label.line} (\\)`, FnWrapper.insertLine)}
      {renderToolButton('Pen', <LeftPanelIcons.Draw />, `${tLeftPanel.label.pen} (P)`, FnWrapper.insertPath)}
      {([selectedDevice?.model, workarea].includes('fbb2') || isDev()) &&
        renderToolButton(
          'curve-engrave',
          <LeftPanelIcons.CurveEngrave />,
          isCurveEngravingDisabled ? lang.global.mode_conflict : tLeftPanel.label.curve_engraving.title,
          () => curveEngravingModeController.start(),
          false,
          isCurveEngravingDisabled,
        )}
      {hasPassthroughExtension &&
        renderToolButton('PassThrough', <LeftPanelIcons.PassThrough />, tLeftPanel.label.pass_through, () =>
          showPassThrough(FnWrapper.useSelectTool),
        )}
      <div className={styles.separator} />
      {renderToolButton('IG', <InstagramOutlined />, 'Instagram', () => browser.open(getSocialMedia().instagram.link))}
      {renderToolButton('DM', <LeftPanelIcons.DM />, 'Design Market', () =>
        browser.open(lang.topbar.menu.link.design_market),
      )}
    </div>
  );
};

export default memo(DrawingToolButtonGroup);
