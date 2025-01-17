import React, { memo, useContext, useEffect, useState } from 'react';

import browser from 'implementations/browser';
import curveEngravingModeController from 'app/actions/canvas/curveEngravingModeController';
import dialogCaller from 'app/actions/dialog-caller';
import eventEmitterFactory from 'helpers/eventEmitterFactory';
import FnWrapper from 'app/actions/beambox/svgeditor-function-wrapper';
import isDev from 'helpers/is-dev';
import LeftPanelIcons from 'app/icons/left-panel/LeftPanelIcons';
import LeftPanelButton from 'app/components/beambox/left-panel/LeftPanelButton';
import useI18n from 'helpers/useI18n';
import { CanvasContext } from 'app/contexts/CanvasContext';
import { getCurrentUser } from 'helpers/api/flux-id';
import { showPassThrough } from 'app/components/pass-through/PassThrough';

const eventEmitter = eventEmitterFactory.createEventEmitter('drawing-tool');

const DrawingToolButtonGroup = ({ className }: { className: string }): JSX.Element => {
  const lang = useI18n();
  const tLeftPanel = lang.beambox.left_panel;
  const { hasPassthroughExtension, selectedDevice, changeToPreviewMode, setupPreviewMode } =
    useContext(CanvasContext);
  const [activeButton, setActiveButton] = useState('Cursor');
  const isSubscribed = getCurrentUser()?.info?.subscription?.is_valid;
  const renderToolButton = (
    id: string,
    icon: JSX.Element,
    label: string,
    onClick: () => void,
    showBadge?: boolean
  ) => (
    <LeftPanelButton
      id={`left-${id}`}
      active={activeButton === id}
      title={label}
      icon={icon}
      onClick={() => {
        setActiveButton(id);
        onClick();
      }}
      showBadge={showBadge}
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
      {renderToolButton(
        'Cursor',
        <LeftPanelIcons.Cursor />,
        `${tLeftPanel.label.cursor} (V)`,
        FnWrapper.useSelectTool
      )}
      {renderToolButton(
        'Photo',
        <LeftPanelIcons.Photo />,
        `${tLeftPanel.label.photo} (I)`,
        FnWrapper.importImage
      )}
      {renderToolButton(
        'MyCloud',
        <LeftPanelIcons.Cloud />,
        tLeftPanel.label.my_cloud,
        () => dialogCaller.showMyCloud(FnWrapper.useSelectTool),
        isSubscribed
      )}
      {renderToolButton(
        'Text',
        <LeftPanelIcons.Text />,
        `${tLeftPanel.label.text} (T)`,
        FnWrapper.insertText
      )}
      {renderToolButton(
        'Element',
        <LeftPanelIcons.Element />,
        `${tLeftPanel.label.shapes} (E)`,
        () => dialogCaller.showShapePanel(FnWrapper.useSelectTool)
      )}
      {renderToolButton(
        'Rectangle',
        <LeftPanelIcons.Rect />,
        `${tLeftPanel.label.rect} (M)`,
        FnWrapper.insertRectangle
      )}
      {renderToolButton(
        'Ellipse',
        <LeftPanelIcons.Oval />,
        `${tLeftPanel.label.oval} (C)`,
        FnWrapper.insertEllipse
      )}
      {renderToolButton(
        'Polygon',
        <LeftPanelIcons.Polygon />,
        tLeftPanel.label.polygon,
        FnWrapper.insertPolygon
      )}
      {renderToolButton(
        'Line',
        <LeftPanelIcons.Line />,
        `${tLeftPanel.label.line} (\\)`,
        FnWrapper.insertLine
      )}
      {renderToolButton(
        'Pen',
        <LeftPanelIcons.Draw />,
        `${tLeftPanel.label.pen} (P)`,
        FnWrapper.insertPath
      )}
      {(selectedDevice?.model === 'fbb2' || isDev()) &&
        renderToolButton(
          'curve-engrave',
          <LeftPanelIcons.CurveEngrave />,
          tLeftPanel.label.curve_engraving.title,
          () => curveEngravingModeController.start()
        )}
      {hasPassthroughExtension &&
        renderToolButton(
          'PassThrough',
          <LeftPanelIcons.PassThrough />,
          tLeftPanel.label.pass_through,
          () => showPassThrough(FnWrapper.useSelectTool)
        )}
      {renderToolButton('DM', <LeftPanelIcons.DM />, 'Design Market', () =>
        browser.open(lang.topbar.menu.link.design_market)
      )}
    </div>
  );
};

export default memo(DrawingToolButtonGroup);
