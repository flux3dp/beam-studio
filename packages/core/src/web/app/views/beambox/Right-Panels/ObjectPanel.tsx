import React, { memo, useContext } from 'react';

import { Button, ConfigProvider } from 'antd';
import classNames from 'classnames';

import FnWrapper from '@core/app/actions/beambox/svgeditor-function-wrapper';
import dialogCaller from '@core/app/actions/dialog-caller';
import { iconButtonTheme } from '@core/app/constants/antd-config';
import { SelectedElementContext } from '@core/app/contexts/SelectedElementContext';
import ObjectPanelIcons from '@core/app/icons/object-panel/ObjectPanelIcons';
import ActionsPanel from '@core/app/views/beambox/Right-Panels/ActionsPanel';
import ConfigPanel from '@core/app/views/beambox/Right-Panels/ConfigPanel/ConfigPanel';
import { ObjectPanelContext } from '@core/app/views/beambox/Right-Panels/contexts/ObjectPanelContext';
import DimensionPanel from '@core/app/views/beambox/Right-Panels/DimensionPanel/DimensionPanel';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import OptionsPanel from '@core/app/views/beambox/Right-Panels/OptionsPanel';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

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

function ObjectPanel({ hide }: Props): React.JSX.Element {
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
      if (['ellipse', 'polygon', 'rect'].includes(e.tagName.toLowerCase())) {
        return true;
      }

      return e.tagName.toLowerCase() === 'path' && svgCanvas.isElemFillable(e);
    };
    const isSingleGroup = elems?.length === 1 && elems[0].tagName.toLowerCase() === 'g';

    return {
      boolean: elems?.length > 1 && elems?.every(allowBooleanOperations),
      difference: elems?.length > 1 && elems?.every(allowBooleanOperations),
      dist: elems?.length > 2,
      group: !isSingleGroup || elems?.length > 1,
      intersect: elems?.length > 1 && elems?.every(allowBooleanOperations),
      subtract: elems?.length === 2 && elems?.every(allowBooleanOperations),
      ungroup: isSingleGroup && !elem.getAttribute('data-textpath-g') && !elem.getAttribute('data-pass-through'),
      union: elems?.length > 1 && elems?.every(allowBooleanOperations),
    };
  };

  const renderToolBtn = (
    label: string,
    icon: React.JSX.Element,
    disabled: boolean,
    onClick: () => void,
    id: string,
  ): React.JSX.Element => (
    <Button disabled={disabled} icon={icon} id={id} onClick={onClick} title={label} type="text" />
  );

  const renderCommonActionPanel = (): React.JSX.Element => (
    <div className={styles.tools}>
      <ObjectPanelItem.Item
        content={<ObjectPanelIcons.Trash />}
        id="delete"
        label={lang.topbar.menu.delete}
        onClick={() => svgEditor.deleteSelected()}
      />
      <ObjectPanelItem.Item
        content={<ObjectPanelIcons.Duplicate />}
        id="duplicate"
        label={lang.topbar.menu.duplicate}
        onClick={async () => svgCanvas.cloneSelectedElements(20, 20)}
      />
      <ObjectPanelItem.Item
        autoClose={false}
        content={<ObjectPanelIcons.Parameter />}
        id="parameter"
        label={lang.beambox.right_panel.laser_panel.parameters}
        onClick={() => {
          dialogCaller.addDialogComponent('config-panel', <ConfigPanel UIType="modal" />);
        }}
      />
    </div>
  );

  const renderToolBtns = (): React.JSX.Element => {
    const buttonAvailability = getAvailableFunctions();

    return isMobile ? (
      <div className={styles.tools}>
        <ObjectPanelItem.Divider />
        <ObjectPanelItem.Item
          content={<ObjectPanelIcons.Group />}
          disabled={!buttonAvailability.group}
          id="group"
          label={tObjectpanel.group}
          onClick={() => svgCanvas.groupSelectedElements()}
        />
        <ObjectPanelItem.Item
          content={<ObjectPanelIcons.Ungroup />}
          disabled={!buttonAvailability.ungroup}
          id="ungroup"
          label={tObjectpanel.ungroup}
          onClick={() => svgCanvas.ungroupSelectedElement()}
        />
        <ObjectPanelItem.ActionList
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
          id="align"
          label={tObjectpanel.align}
        />
        <ObjectPanelItem.ActionList
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
          disabled={!buttonAvailability.dist}
          id="distribute"
          label={tObjectpanel.distribute}
        />
        <ObjectPanelItem.ActionList
          actions={[
            {
              disabled: !buttonAvailability.union,
              icon: <ObjectPanelIcons.Union />,
              label: tObjectpanel.union,
              onClick: () => svgCanvas.booleanOperationSelectedElements('union'),
            },
            {
              disabled: !buttonAvailability.subtract,
              icon: <ObjectPanelIcons.Subtract />,
              label: tObjectpanel.subtract,
              onClick: () => svgCanvas.booleanOperationSelectedElements('diff'),
            },
            {
              disabled: !buttonAvailability.intersect,
              icon: <ObjectPanelIcons.Intersect />,
              label: tObjectpanel.intersect,
              onClick: () => svgCanvas.booleanOperationSelectedElements('intersect'),
            },
            {
              disabled: !buttonAvailability.difference,
              icon: <ObjectPanelIcons.Diff />,
              label: tObjectpanel.difference,
              onClick: () => svgCanvas.booleanOperationSelectedElements('xor'),
            },
          ]}
          content={<ObjectPanelIcons.Union />}
          disabled={!buttonAvailability.boolean}
          id="boolean"
          label={tObjectpanel.boolean}
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
                'hdist',
              )}
              {renderToolBtn(
                tObjectpanel.top_align,
                <ObjectPanelIcons.VAlignTop />,
                false,
                FnWrapper.alignTop,
                'top_align',
              )}
              {renderToolBtn(
                tObjectpanel.middle_align,
                <ObjectPanelIcons.VAlignMid />,
                false,
                FnWrapper.alignMiddle,
                'middle_align',
              )}
              {renderToolBtn(
                tObjectpanel.bottom_align,
                <ObjectPanelIcons.VAlignBot />,
                false,
                FnWrapper.alignBottom,
                'bottom_align',
              )}
            </div>
            <div className={classNames(styles.half, styles.right)}>
              {renderToolBtn(
                tObjectpanel.vdist,
                <ObjectPanelIcons.VDist />,
                !buttonAvailability.dist,
                () => svgCanvas.distVert(),
                'vdist',
              )}
              {renderToolBtn(
                tObjectpanel.left_align,
                <ObjectPanelIcons.HAlignLeft />,
                false,
                FnWrapper.alignLeft,
                'left_align',
              )}
              {renderToolBtn(
                tObjectpanel.center_align,
                <ObjectPanelIcons.HAlignMid />,
                false,
                FnWrapper.alignCenter,
                'center_align',
              )}
              {renderToolBtn(
                tObjectpanel.right_align,
                <ObjectPanelIcons.HAlignRight />,
                false,
                FnWrapper.alignRight,
                'right_align',
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
                'group',
              )}
              {renderToolBtn(
                tObjectpanel.ungroup,
                <ObjectPanelIcons.Ungroup />,
                !buttonAvailability.ungroup,
                () => svgCanvas.ungroupSelectedElement(),
                'ungroup',
              )}
            </div>
            <div className={classNames(styles.half, styles.right)}>
              {renderToolBtn(
                tObjectpanel.union,
                <ObjectPanelIcons.Union />,
                !buttonAvailability.union,
                () => svgCanvas.booleanOperationSelectedElements('union'),
                'union',
              )}
              {renderToolBtn(
                tObjectpanel.subtract,
                <ObjectPanelIcons.Subtract />,
                !buttonAvailability.subtract,
                () => svgCanvas.booleanOperationSelectedElements('diff'),
                'subtract',
              )}
              {renderToolBtn(
                tObjectpanel.intersect,
                <ObjectPanelIcons.Intersect />,
                !buttonAvailability.intersect,
                () => svgCanvas.booleanOperationSelectedElements('intersect'),
                'intersect',
              )}
              {renderToolBtn(
                tObjectpanel.difference,
                <ObjectPanelIcons.Diff />,
                !buttonAvailability.difference,
                () => svgCanvas.booleanOperationSelectedElements('xor'),
                'difference',
              )}
            </div>
          </div>
        </ConfigProvider>
      </div>
    );
  };

  const renderDimensionPanel = (): React.JSX.Element => {
    const { getDimensionValues, updateDimensionValues } = context;

    return (
      <DimensionPanel
        elem={elem}
        getDimensionValues={getDimensionValues}
        updateDimensionValues={updateDimensionValues}
      />
    );
  };

  const renderOptionPanel = (): React.JSX.Element => {
    const { dimensionValues, polygonSides, updateDimensionValues, updateObjectPanel } = context;

    return (
      <OptionsPanel
        elem={elem}
        polygonSides={polygonSides}
        rx={dimensionValues.rx}
        updateDimensionValues={updateDimensionValues}
        updateObjectPanel={updateObjectPanel}
      />
    );
  };

  const renderActionPanel = (): React.JSX.Element => <ActionsPanel elem={elem} />;

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
    <div className={classNames(styles.container, { [styles.hide]: hide })} id="object-panel">
      {elem ? contents : null}
    </div>
  );
}

export default memo(ObjectPanel);
