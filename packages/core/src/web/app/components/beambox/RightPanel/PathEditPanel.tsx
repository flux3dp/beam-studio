import React, { useEffect } from 'react';

import { Button, ConfigProvider, Divider, Space } from 'antd';
import classNames from 'classnames';

import type { ISVGEditor } from '@core/app/actions/beambox/svg-editor';
import { textButtonTheme } from '@core/app/constants/antd-config';
import { TrashIcon } from '@core/app/icons/icons';
import PathEditIcons from '@core/app/icons/path-edit-panel/PathEditIcons';
import { useIsMobile, useIsTabletOrMobile } from '@core/app/stores/layoutStore';
import AutoHeightDrawer from '@core/app/widgets/AutoHeightDrawer';
import DraggableModal from '@core/app/widgets/DraggableModal';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import useForceUpdate from '@core/helpers/use-force-update';
import useI18n from '@core/helpers/useI18n';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';
import type { ISVGPath } from '@core/interfaces/ISVGPath';

import styles from './PathEditPanel.module.scss';

let svgedit: any;
let svgEditor: ISVGEditor;
let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgedit = globalSVG.Edit;
  svgEditor = globalSVG.Editor;
  svgCanvas = globalSVG.Canvas;
});

const rightPanelEventEmitter = eventEmitterFactory.createEventEmitter('right-panel');

const LINKTYPE_CORNER = 0;
const LINKTYPE_SMOOTH = 1; // same direction, different dist
const LINKTYPE_SYMMETRIC = 2; // same direction, same dist

const PanelContent = ({ isMobile = false }: { isMobile?: boolean }): React.ReactNode => {
  const lang = useI18n().beambox.right_panel.object_panel.path_edit_panel;
  const forceUpdate = useForceUpdate();
  const onNodeTypeChange = (newType: number) => {
    svgedit.path.path.setSelectedNodeType(newType);
  };

  useEffect(() => {
    rightPanelEventEmitter.on('UPDATE_PATH_EDIT_PANEL', forceUpdate);

    return () => {
      rightPanelEventEmitter.off('UPDATE_PATH_EDIT_PANEL', forceUpdate);
    };
  }, [forceUpdate]);

  const currentPath: ISVGPath = svgedit?.path.path;
  let containsSharpNodes = false;
  let containsRoundNodes = false;
  const isDisabled = !currentPath || currentPath.selected_pts.length === 0;
  let selectedNodeTypes: number[] = [];
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
      {!isMobile && <div className={styles.title}>{lang.node_type}</div>}
      <ConfigProvider theme={textButtonTheme}>
        <ConfigProvider theme={{ token: { borderRadius: 4, controlHeight: isMobile ? 30 : 24 } }}>
          <Space.Compact block>
            {[
              { icon: <PathEditIcons.Corner />, title: 'Corner', value: LINKTYPE_CORNER },
              { icon: <PathEditIcons.Smooth />, title: 'Smooth', value: LINKTYPE_SMOOTH },
              { icon: <PathEditIcons.Symmetry />, title: 'Symmetry', value: LINKTYPE_SYMMETRIC },
            ].map(({ icon, title, value }) => (
              <Button
                className={classNames(styles['compact-button'], {
                  [styles.active]: selectedNodeTypes.includes(value),
                })}
                disabled={isDisabled}
                icon={icon}
                key={title}
                onClick={() => onNodeTypeChange(value)}
                shape={buttonShape}
                title={title}
              />
            ))}
          </Space.Compact>
        </ConfigProvider>
        <Divider className={styles.divider} />
        <Space className={styles.actions} wrap>
          <Button
            block
            className={styles.button}
            disabled={!containsRoundNodes}
            icon={<PathEditIcons.Sharp />}
            onClick={() => svgCanvas.pathActions.setSharp()}
            shape={buttonShape}
          >
            <span className={styles.label}>{lang.sharp}</span>
          </Button>
          <Button
            block
            className={styles.button}
            disabled={!containsSharpNodes}
            icon={<PathEditIcons.Round />}
            onClick={() => svgCanvas.pathActions.setRound()}
            shape={buttonShape}
          >
            <span className={styles.label}>{lang.round}</span>
          </Button>
          <Button
            block
            className={styles.button}
            disabled={!canConnect}
            icon={<PathEditIcons.Connect />}
            onClick={() => svgCanvas.pathActions.connectNodes()}
            shape={buttonShape}
          >
            <span className={styles.label}>{lang.connect}</span>
          </Button>
          <Button
            block
            className={styles.button}
            disabled={!canDisconnect}
            icon={<PathEditIcons.Disconnect />}
            onClick={() => svgCanvas.pathActions.disconnectNode()}
            shape={buttonShape}
          >
            <span className={styles.label}>{lang.disconnect}</span>
          </Button>
          {isMobile && (
            <Button
              block
              className={styles.button}
              disabled={!canDelete}
              icon={<TrashIcon />}
              onClick={() => svgEditor.deleteSelected()}
              shape={buttonShape}
            >
              <span className={styles.label}>{lang.delete}</span>
            </Button>
          )}
        </Space>
      </ConfigProvider>
    </div>
  );
};

const onClose = () => svgCanvas?.pathActions.toSelectMode(svgedit?.path.path.elem);

function PathEditPanel(): React.ReactNode {
  const isMobile = useIsMobile();
  const isTablet = useIsTabletOrMobile();
  const title = useI18n().topbar.menu.tab_path_edit;

  return isMobile ? (
    <AutoHeightDrawer
      className={styles.panel}
      destroyOnClose
      enableResizable={{ top: true }}
      getContainer={() => document.querySelector('#svg_editor') ?? document.body}
      onClose={onClose}
      open
      title={title}
    >
      <PanelContent isMobile />
    </AutoHeightDrawer>
  ) : isTablet ? (
    <DraggableModal
      defaultPosition={{ x: -60, y: 60 }}
      footer={null}
      mask={false}
      onCancel={onClose}
      open
      title={title}
      width={400}
      wrapClassName={styles['modal-wrap']}
      xRef="right"
      yRef="top"
    >
      <div className={styles.panel}>
        <PanelContent />
      </div>
    </DraggableModal>
  ) : (
    <div className={styles.panel} id="pathedit-panel">
      <PanelContent />
    </div>
  );
}

export default PathEditPanel;
