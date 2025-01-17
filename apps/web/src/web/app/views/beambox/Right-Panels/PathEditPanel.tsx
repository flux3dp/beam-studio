import React, { useEffect } from 'react';
import classNames from 'classnames';
import { Button, ConfigProvider, Divider, Space } from 'antd';

import eventEmitterFactory from 'helpers/eventEmitterFactory';
import FloatingPanel from 'app/widgets/FloatingPanel';
import i18n from 'helpers/i18n';
import ISVGCanvas from 'interfaces/ISVGCanvas';
import PathEditIcons from 'app/icons/path-edit-panel/PathEditIcons';
import useForceUpdate from 'helpers/use-force-update';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { ISVGPath } from 'interfaces/ISVGPath';
import { textButtonTheme } from 'app/constants/antd-config';
import { TrashIcon } from 'app/icons/icons';
import { useIsMobile } from 'helpers/system-helper';

import styles from './PathEditPanel.module.scss';

let svgedit;
let svgEditor;
let svgCanvas: ISVGCanvas;
getSVGAsync((globalSVG) => {
  svgedit = globalSVG.Edit;
  svgEditor = globalSVG.Editor;
  svgCanvas = globalSVG.Canvas;
});

const rightPanelEventEmitter = eventEmitterFactory.createEventEmitter('right-panel');
const LANG = i18n.lang.beambox.right_panel.object_panel.path_edit_panel;

const LINKTYPE_CORNER = 0;
const LINKTYPE_SMOOTH = 1; // same direction, different dist
const LINKTYPE_SYMMETRIC = 2; // same direction, same dist

const PanelContent = ({ isMobile = false }: { isMobile?: boolean }) => {
  const forceUpdate = useForceUpdate();
  const onNodeTypeChange = (newType) => {
    svgedit.path.path.setSelectedNodeType(newType);
  };

  useEffect(() => {
    rightPanelEventEmitter.on('UPDATE_PATH_EDIT_PANEL', forceUpdate);
    return () => {
      rightPanelEventEmitter.off('UPDATE_PATH_EDIT_PANEL', forceUpdate);
    };
  }, [forceUpdate]);
  const currentPath: ISVGPath = svgedit.path.path;
  let containsSharpNodes = false;
  let containsRoundNodes = false;
  const isDisabled = !currentPath || currentPath.selected_pts.length === 0;
  let selectedNodeTypes = [];
  const selectedNodes = currentPath?.selected_pts
    .map((index) => currentPath.nodePoints[index])
    .filter((point) => point);
  if (currentPath) {
    containsSharpNodes = selectedNodes.some((node) => node.isSharp());
    containsRoundNodes = selectedNodes.some((node) => node.isRound());
    selectedNodes.forEach((node) => {
      if (node) {
        selectedNodeTypes.push(node.linkType);
      }
    });
    selectedNodeTypes = [...new Set(selectedNodeTypes)];
    selectedNodeTypes.sort();
    if (selectedNodeTypes.length > 1) {
      selectedNodeTypes = [];
    }
  }

  const canConnect = selectedNodes?.length === 2 && selectedNodes.every((point) => !point.prevSeg || !point.nextSeg);
  const canDisconnect = selectedNodes?.length === 1 && selectedNodes[0].prev && selectedNodes[0].next;
  const canDelete = selectedNodes?.length > 0;
  const buttonShape = isMobile ? 'round' : 'default';

  return (
    <div className={styles['node-type-panel']}>
      {!isMobile && <div className={styles.title}>{LANG.node_type}</div>}
      <ConfigProvider theme={textButtonTheme}>
        <ConfigProvider theme={{ token: { controlHeight: isMobile ? 30 : 24, borderRadius: 4 } }}>
          <Space.Compact block>
            {[
              { title: 'Corner', value: LINKTYPE_CORNER, icon: <PathEditIcons.Corner /> },
              { title: 'Smooth', value: LINKTYPE_SMOOTH, icon: <PathEditIcons.Smooth /> },
              { title: 'Symmetry', value: LINKTYPE_SYMMETRIC, icon: <PathEditIcons.Symmetry /> },
            ].map(({ title, value, icon }) => (
              <Button
                className={classNames(styles['compact-button'], {
                  [styles.active]: selectedNodeTypes.includes(value),
                })}
                key={title}
                title={title}
                icon={icon}
                onClick={() => onNodeTypeChange(value)}
                shape={buttonShape}
                disabled={isDisabled}
              />
            ))}
          </Space.Compact>
        </ConfigProvider>
        <Divider className={styles.divider} />
        <Space className={styles.actions} wrap>
          <Button
            className={styles.button}
            disabled={!containsRoundNodes}
            onClick={() => svgCanvas.pathActions.setSharp()}
            shape={buttonShape}
            icon={<PathEditIcons.Sharp />}
            block
          >
            <span className={styles.label}>{LANG.sharp}</span>
          </Button>
          <Button
            className={styles.button}
            disabled={!containsSharpNodes}
            onClick={() => svgCanvas.pathActions.setRound()}
            shape={buttonShape}
            icon={<PathEditIcons.Round />}
            block
          >
            <span className={styles.label}>{LANG.round}</span>
          </Button>
          <Button
            className={styles.button}
            disabled={!canConnect}
            onClick={svgCanvas.pathActions.connectNodes}
            shape={buttonShape}
            icon={<PathEditIcons.Connect />}
            block
          >
            <span className={styles.label}>{LANG.connect}</span>
          </Button>
          <Button
            className={styles.button}
            disabled={!canDisconnect}
            onClick={svgCanvas.pathActions.disconnectNode}
            shape={buttonShape}
            icon={<PathEditIcons.Disconnect />}
            block
          >
            <span className={styles.label}>{LANG.disconnect}</span>
          </Button>
          {isMobile && (
            <Button
              className={styles.button}
              disabled={!canDelete}
              onClick={svgEditor.deleteSelected}
              shape={buttonShape}
              icon={<TrashIcon />}
              block
            >
              <span className={styles.label}>{LANG.delete}</span>
            </Button>
          )}
        </Space>
      </ConfigProvider>
    </div>
  );
};

function PathEditPanel(): JSX.Element {
  const isMobile = useIsMobile();
  if (!svgCanvas || !svgedit) return null;

  return isMobile ? (
    <FloatingPanel
      className={styles.panel}
      anchors={[0, 280]}
      title={i18n.lang.beambox.right_panel.tabs.path_edit}
      onClose={() => svgCanvas.pathActions.toSelectMode(svgedit.path.path.elem)}
    >
      <PanelContent isMobile />
    </FloatingPanel>
  ) : (
    <div id="pathedit-panel" className={styles.panel}>
      <PanelContent />
    </div>
  );
}

export default PathEditPanel;
