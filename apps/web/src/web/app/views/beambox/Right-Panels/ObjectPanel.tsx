import classNames from 'classnames';
import React, { memo, useContext } from 'react';
import { Button, ConfigProvider } from 'antd';

import ActionsPanel from 'app/views/beambox/Right-Panels/ActionsPanel';
import ConfigPanel from 'app/views/beambox/Right-Panels/ConfigPanel/ConfigPanel';
import dialogCaller from 'app/actions/dialog-caller';
import DimensionPanel from 'app/views/beambox/Right-Panels/DimensionPanel/DimensionPanel';
import FnWrapper from 'app/actions/beambox/svgeditor-function-wrapper';
import ObjectPanelIcons from 'app/icons/object-panel/ObjectPanelIcons';
import ObjectPanelItem from 'app/views/beambox/Right-Panels/ObjectPanelItem';
import OptionsPanel from 'app/views/beambox/Right-Panels/OptionsPanel';
import useI18n from 'helpers/useI18n';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { iconButtonTheme } from 'app/constants/antd-config';
import { ObjectPanelContext } from 'app/views/beambox/Right-Panels/contexts/ObjectPanelContext';
import { SelectedElementContext } from 'app/contexts/SelectedElementContext';
import { useIsMobile } from 'helpers/system-helper';

import styles from './ObjectPanel.module.scss';

let svgCanvas;
let svgEditor;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
  svgEditor = globalSVG.Editor;
});

interface Props {
  hide?: boolean;
}

function ObjectPanel({ hide }: Props): JSX.Element {
  const lang = useI18n();
  const tObjectpanel = lang.beambox.right_panel.object_panel;
  const isMobile = useIsMobile();
  const context = useContext(ObjectPanelContext);
  const { selectedElement: elem } = useContext(SelectedElementContext);
  const getAvailableFunctions = () => {
    if (!elem) {
      return {};
    }
    let elems = [elem];
    if (elems.length > 0 && elems[0].getAttribute('data-tempgroup') === 'true') {
      elems = Array.from(elems[0].childNodes) as Element[];
    }
    const allowBooleanOperations = (e: Element) => {
      if (['rect', 'polygon', 'ellipse'].includes(e.tagName.toLowerCase())) {
        return true;
      }
      return e.tagName.toLowerCase() === 'path' && svgCanvas.isElemFillable(e);
    };
    const isSingleGroup = elems?.length === 1 && elems[0].tagName.toLowerCase() === 'g';
    return {
      group: !isSingleGroup || elems?.length > 1,
      ungroup:
        isSingleGroup &&
        !elem.getAttribute('data-textpath-g') &&
        !elem.getAttribute('data-pass-through'),
      dist: elems?.length > 2,
      boolean: elems?.length > 1 && elems?.every(allowBooleanOperations),
      union: elems?.length > 1 && elems?.every(allowBooleanOperations),
      subtract: elems?.length === 2 && elems?.every(allowBooleanOperations),
      intersect: elems?.length > 1 && elems?.every(allowBooleanOperations),
      difference: elems?.length > 1 && elems?.every(allowBooleanOperations),
    };
  };

  const renderToolBtn = (
    label: string,
    icon: JSX.Element,
    disabled: boolean,
    onClick: () => void,
    id: string
  ): JSX.Element => (
    <Button type="text" id={id} icon={icon} onClick={onClick} disabled={disabled} title={label} />
  );

  const renderCommonActionPanel = (): JSX.Element => (
    <div className={styles.tools}>
      <ObjectPanelItem.Item
        id="delete"
        content={<ObjectPanelIcons.Trash />}
        label={lang.topbar.menu.delete}
        onClick={() => svgEditor.deleteSelected()}
      />
      <ObjectPanelItem.Item
        id="duplicate"
        content={<ObjectPanelIcons.Duplicate />}
        label={lang.topbar.menu.duplicate}
        onClick={async () => svgCanvas.cloneSelectedElements(20, 20)}
      />
      <ObjectPanelItem.Item
        id="parameter"
        content={<ObjectPanelIcons.Parameter />}
        label={lang.beambox.right_panel.laser_panel.parameters}
        onClick={() => {
          dialogCaller.addDialogComponent('config-panel', <ConfigPanel UIType="modal" />);
        }}
        autoClose={false}
      />
    </div>
  );

  const renderToolBtns = (): JSX.Element => {
    const buttonAvailability = getAvailableFunctions();
    return isMobile ? (
      <div className={styles.tools}>
        <ObjectPanelItem.Divider />
        <ObjectPanelItem.Item
          id="group"
          content={<ObjectPanelIcons.Group />}
          label={tObjectpanel.group}
          onClick={() => svgCanvas.groupSelectedElements()}
          disabled={!buttonAvailability.group}
        />
        <ObjectPanelItem.Item
          id="ungroup"
          content={<ObjectPanelIcons.Ungroup />}
          label={tObjectpanel.ungroup}
          onClick={() => svgCanvas.ungroupSelectedElement()}
          disabled={!buttonAvailability.ungroup}
        />
        <ObjectPanelItem.ActionList
          id="align"
          actions={[
            {
              icon: <ObjectPanelIcons.VAlignTop />,
              label: tObjectpanel.top_align,
              onClick: FnWrapper.alignTop,
            },
            {
              icon: <ObjectPanelIcons.VAlignMid />,
              label: tObjectpanel.middle_align,
              onClick: FnWrapper.alignMiddle,
            },
            {
              icon: <ObjectPanelIcons.VAlignBot />,
              label: tObjectpanel.bottom_align,
              onClick: FnWrapper.alignBottom,
            },
            {
              icon: <ObjectPanelIcons.HAlignLeft />,
              label: tObjectpanel.left_align,
              onClick: FnWrapper.alignLeft,
            },
            {
              icon: <ObjectPanelIcons.HAlignMid />,
              label: tObjectpanel.center_align,
              onClick: FnWrapper.alignCenter,
            },
            {
              icon: <ObjectPanelIcons.HAlignRight />,
              label: tObjectpanel.right_align,
              onClick: FnWrapper.alignRight,
            },
          ]}
          content={<ObjectPanelIcons.VAlignMid />}
          label={tObjectpanel.align}
        />
        <ObjectPanelItem.ActionList
          id="distribute"
          actions={[
            {
              icon: <ObjectPanelIcons.HDist />,
              label: tObjectpanel.hdist,
              onClick: () => svgCanvas.distHori(),
            },
            {
              icon: <ObjectPanelIcons.VDist />,
              label: tObjectpanel.vdist,
              onClick: () => svgCanvas.distVert(),
            },
          ]}
          content={<ObjectPanelIcons.VDist />}
          label={tObjectpanel.distribute}
          disabled={!buttonAvailability.dist}
        />
        <ObjectPanelItem.ActionList
          id="boolean"
          actions={[
            {
              icon: <ObjectPanelIcons.Union />,
              label: tObjectpanel.union,
              onClick: () => svgCanvas.booleanOperationSelectedElements('union'),
              disabled: !buttonAvailability.union,
            },
            {
              icon: <ObjectPanelIcons.Subtract />,
              label: tObjectpanel.subtract,
              onClick: () => svgCanvas.booleanOperationSelectedElements('diff'),
              disabled: !buttonAvailability.subtract,
            },
            {
              icon: <ObjectPanelIcons.Intersect />,
              label: tObjectpanel.intersect,
              onClick: () => svgCanvas.booleanOperationSelectedElements('intersect'),
              disabled: !buttonAvailability.intersect,
            },
            {
              icon: <ObjectPanelIcons.Diff />,
              label: tObjectpanel.difference,
              onClick: () => svgCanvas.booleanOperationSelectedElements('xor'),
              disabled: !buttonAvailability.difference,
            },
          ]}
          content={<ObjectPanelIcons.Union />}
          label={tObjectpanel.boolean}
          disabled={!buttonAvailability.boolean}
        />
      </div>
    ) : (
      <div className={styles.tools}>
        <ConfigProvider theme={iconButtonTheme}>
          <div className={styles.row}>
            <div className={classNames(styles.half, styles.left, styles.sep)}>
              {renderToolBtn(
                tObjectpanel.hdist,
                <ObjectPanelIcons.HDist />,
                !buttonAvailability.dist,
                () => svgCanvas.distHori(),
                'hdist'
              )}
              {renderToolBtn(
                tObjectpanel.top_align,
                <ObjectPanelIcons.VAlignTop />,
                false,
                FnWrapper.alignTop,
                'top_align'
              )}
              {renderToolBtn(
                tObjectpanel.middle_align,
                <ObjectPanelIcons.VAlignMid />,
                false,
                FnWrapper.alignMiddle,
                'middle_align'
              )}
              {renderToolBtn(
                tObjectpanel.bottom_align,
                <ObjectPanelIcons.VAlignBot />,
                false,
                FnWrapper.alignBottom,
                'bottom_align'
              )}
            </div>
            <div className={classNames(styles.half, styles.right)}>
              {renderToolBtn(
                tObjectpanel.vdist,
                <ObjectPanelIcons.VDist />,
                !buttonAvailability.dist,
                () => svgCanvas.distVert(),
                'vdist'
              )}
              {renderToolBtn(
                tObjectpanel.left_align,
                <ObjectPanelIcons.HAlignLeft />,
                false,
                FnWrapper.alignLeft,
                'left_align'
              )}
              {renderToolBtn(
                tObjectpanel.center_align,
                <ObjectPanelIcons.HAlignMid />,
                false,
                FnWrapper.alignCenter,
                'center_align'
              )}
              {renderToolBtn(
                tObjectpanel.right_align,
                <ObjectPanelIcons.HAlignRight />,
                false,
                FnWrapper.alignRight,
                'right_align'
              )}
            </div>
          </div>
          <div className={styles.row}>
            <div className={classNames(styles.half, styles.left)}>
              {renderToolBtn(
                tObjectpanel.group,
                <ObjectPanelIcons.Group />,
                !buttonAvailability.group,
                () => svgCanvas.groupSelectedElements(),
                'group'
              )}
              {renderToolBtn(
                tObjectpanel.ungroup,
                <ObjectPanelIcons.Ungroup />,
                !buttonAvailability.ungroup,
                () => svgCanvas.ungroupSelectedElement(),
                'ungroup'
              )}
            </div>
            <div className={classNames(styles.half, styles.right)}>
              {renderToolBtn(
                tObjectpanel.union,
                <ObjectPanelIcons.Union />,
                !buttonAvailability.union,
                () => svgCanvas.booleanOperationSelectedElements('union'),
                'union'
              )}
              {renderToolBtn(
                tObjectpanel.subtract,
                <ObjectPanelIcons.Subtract />,
                !buttonAvailability.subtract,
                () => svgCanvas.booleanOperationSelectedElements('diff'),
                'subtract'
              )}
              {renderToolBtn(
                tObjectpanel.intersect,
                <ObjectPanelIcons.Intersect />,
                !buttonAvailability.intersect,
                () => svgCanvas.booleanOperationSelectedElements('intersect'),
                'intersect'
              )}
              {renderToolBtn(
                tObjectpanel.difference,
                <ObjectPanelIcons.Diff />,
                !buttonAvailability.difference,
                () => svgCanvas.booleanOperationSelectedElements('xor'),
                'difference'
              )}
            </div>
          </div>
        </ConfigProvider>
      </div>
    );
  };

  const renderDimensionPanel = (): JSX.Element => {
    const { updateDimensionValues, getDimensionValues } = context;
    return (
      <DimensionPanel
        elem={elem}
        updateDimensionValues={updateDimensionValues}
        getDimensionValues={getDimensionValues}
      />
    );
  };

  const renderOptionPanel = (): JSX.Element => {
    const { polygonSides, dimensionValues, updateDimensionValues, updateObjectPanel } = context;
    return (
      <OptionsPanel
        elem={elem}
        rx={dimensionValues.rx}
        polygonSides={polygonSides}
        updateObjectPanel={updateObjectPanel}
        updateDimensionValues={updateDimensionValues}
      />
    );
  };

  const renderActionPanel = (): JSX.Element => <ActionsPanel elem={elem} />;

  const contents = isMobile ? (
    <>
      {renderCommonActionPanel()}
      {renderOptionPanel()}
      {renderDimensionPanel()}
      {renderToolBtns()}
      {renderActionPanel()}
    </>
  ) : (
    <>
      {renderToolBtns()}
      {renderDimensionPanel()}
      {renderOptionPanel()}
      {renderActionPanel()}
    </>
  );

  return (
    <div id="object-panel" className={classNames(styles.container, { [styles.hide]: hide })}>
      {elem ? contents : null}
    </div>
  );
}

export default memo(ObjectPanel);
