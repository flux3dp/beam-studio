import React, { memo, useContext } from 'react';

import { Button, ConfigProvider } from 'antd';
import classNames from 'classnames';

import type { ISVGEditor } from '@core/app/actions/beambox/svg-editor';
import FnWrapper from '@core/app/actions/beambox/svgeditor-function-wrapper';
import dialogCaller from '@core/app/actions/dialog-caller';
import { iconButtonTheme } from '@core/app/constants/antd-config';
import { CanvasElements } from '@core/app/constants/canvasElements';
import { SelectedElementContext } from '@core/app/contexts/SelectedElementContext';
import ObjectPanelIcons from '@core/app/icons/object-panel/ObjectPanelIcons';
import { cloneSelectedElements } from '@core/app/svgedit/operations/clipboard';
import ActionsPanel from '@core/app/views/beambox/Right-Panels/ActionsPanel';
import ConfigPanel from '@core/app/views/beambox/Right-Panels/ConfigPanel/ConfigPanel';
import DimensionPanel from '@core/app/views/beambox/Right-Panels/DimensionPanel/DimensionPanel';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import OptionsPanel from '@core/app/views/beambox/Right-Panels/OptionsPanel';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import styles from './ObjectPanel.module.scss';
import { convertAndBooleanOperate } from './utils/convertAndBooleanOperate';

let svgCanvas: ISVGCanvas;
let svgEditor: ISVGEditor;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
  svgEditor = globalSVG.Editor;
});

interface Props {
  hide?: boolean;
}

function ObjectPanel({ hide }: Props): React.JSX.Element {
  const lang = useI18n();
  const tObjectPanel = lang.beambox.right_panel.object_panel;
  const isMobile = useIsMobile();
  const { selectedElement: elem } = useContext(SelectedElementContext);
  const getAvailableFunctions = () => {
    if (!elem) {
      return {};
    }

    const elems = elem.getAttribute('data-tempgroup') === 'true' ? (Array.from(elem.childNodes) as Element[]) : [elem];

    const allowBooleanOperations = (e: Element) => {
      const lowerCase = e.tagName.toLowerCase();

      if (!CanvasElements.fillableElems.includes(lowerCase)) return false;

      if (lowerCase === 'path' && !svgCanvas.calcPathClosed(e)) return false;

      return true;
    };
    const isSingleGroup = elems?.length === 1 && elems[0].tagName.toLowerCase() === 'g';
    const canDoBoolean = elems?.every(allowBooleanOperations);

    return {
      boolean: elems?.length > 1 && canDoBoolean,
      difference: elems?.length > 1 && canDoBoolean,
      dist: elems?.length > 2,
      group: !isSingleGroup || elems?.length > 1,
      intersect: elems?.length > 1 && canDoBoolean,
      subtract: elems?.length === 2 && canDoBoolean,
      ungroup: isSingleGroup && !elem.getAttribute('data-textpath-g') && !elem.getAttribute('data-pass-through'),
      union: elems?.length > 1 && canDoBoolean,
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
        onClick={async () => cloneSelectedElements(20, 20)}
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
          label={tObjectPanel.group}
          onClick={() => svgCanvas.groupSelectedElements()}
        />
        <ObjectPanelItem.Item
          content={<ObjectPanelIcons.Ungroup />}
          disabled={!buttonAvailability.ungroup}
          id="ungroup"
          label={tObjectPanel.ungroup}
          onClick={() => svgCanvas.ungroupSelectedElement()}
        />
        <ObjectPanelItem.ActionList
          actions={[
            { icon: <ObjectPanelIcons.VAlignTop />, label: tObjectPanel.top_align, onClick: FnWrapper.alignTop },
            { icon: <ObjectPanelIcons.VAlignMid />, label: tObjectPanel.middle_align, onClick: FnWrapper.alignMiddle },
            { icon: <ObjectPanelIcons.VAlignBot />, label: tObjectPanel.bottom_align, onClick: FnWrapper.alignBottom },
            { icon: <ObjectPanelIcons.HAlignLeft />, label: tObjectPanel.left_align, onClick: FnWrapper.alignLeft },
            { icon: <ObjectPanelIcons.HAlignMid />, label: tObjectPanel.center_align, onClick: FnWrapper.alignCenter },
            { icon: <ObjectPanelIcons.HAlignRight />, label: tObjectPanel.right_align, onClick: FnWrapper.alignRight },
          ]}
          content={<ObjectPanelIcons.VAlignMid />}
          id="align"
          label={tObjectPanel.align}
        />
        <ObjectPanelItem.ActionList
          actions={[
            { icon: <ObjectPanelIcons.HDist />, label: tObjectPanel.hdist, onClick: svgCanvas?.distHori },
            { icon: <ObjectPanelIcons.VDist />, label: tObjectPanel.vdist, onClick: svgCanvas?.distVert },
          ]}
          content={<ObjectPanelIcons.VDist />}
          disabled={!buttonAvailability.dist}
          id="distribute"
          label={tObjectPanel.distribute}
        />
        <ObjectPanelItem.ActionList
          actions={[
            {
              disabled: !buttonAvailability.union,
              icon: <ObjectPanelIcons.Union />,
              label: tObjectPanel.union,
              onClick: async () => convertAndBooleanOperate({ element: elem as SVGGElement, operation: 'union' }),
            },
            {
              disabled: !buttonAvailability.subtract,
              icon: <ObjectPanelIcons.Subtract />,
              label: tObjectPanel.subtract,
              onClick: async () => convertAndBooleanOperate({ element: elem as SVGGElement, operation: 'diff' }),
            },
            {
              disabled: !buttonAvailability.intersect,
              icon: <ObjectPanelIcons.Intersect />,
              label: tObjectPanel.intersect,
              onClick: async () => convertAndBooleanOperate({ element: elem as SVGGElement, operation: 'intersect' }),
            },
            {
              disabled: !buttonAvailability.difference,
              icon: <ObjectPanelIcons.Diff />,
              label: tObjectPanel.difference,
              onClick: async () => convertAndBooleanOperate({ element: elem as SVGGElement, operation: 'xor' }),
            },
          ]}
          content={<ObjectPanelIcons.Union />}
          disabled={!buttonAvailability.boolean}
          id="boolean"
          label={tObjectPanel.boolean}
        />
      </div>
    ) : (
      <div className={styles.tools}>
        <ConfigProvider theme={iconButtonTheme}>
          <div className={styles.row} data-tutorial="object-align-buttons">
            <div className={classNames(styles.half, styles.left, styles.sep)}>
              {renderToolBtn(
                tObjectPanel.hdist,
                <ObjectPanelIcons.HDist />,
                !buttonAvailability.dist,
                () => svgCanvas.distHori(),
                'hdist',
              )}
              {renderToolBtn(
                tObjectPanel.top_align,
                <ObjectPanelIcons.VAlignTop />,
                false,
                FnWrapper.alignTop,
                'top_align',
              )}
              {renderToolBtn(
                tObjectPanel.middle_align,
                <ObjectPanelIcons.VAlignMid />,
                false,
                FnWrapper.alignMiddle,
                'middle_align',
              )}
              {renderToolBtn(
                tObjectPanel.bottom_align,
                <ObjectPanelIcons.VAlignBot />,
                false,
                FnWrapper.alignBottom,
                'bottom_align',
              )}
            </div>
            <div className={classNames(styles.half, styles.right)}>
              {renderToolBtn(
                tObjectPanel.vdist,
                <ObjectPanelIcons.VDist />,
                !buttonAvailability.dist,
                () => svgCanvas.distVert(),
                'vdist',
              )}
              {renderToolBtn(
                tObjectPanel.left_align,
                <ObjectPanelIcons.HAlignLeft />,
                false,
                FnWrapper.alignLeft,
                'left_align',
              )}
              {renderToolBtn(
                tObjectPanel.center_align,
                <ObjectPanelIcons.HAlignMid />,
                false,
                FnWrapper.alignCenter,
                'center_align',
              )}
              {renderToolBtn(
                tObjectPanel.right_align,
                <ObjectPanelIcons.HAlignRight />,
                false,
                FnWrapper.alignRight,
                'right_align',
              )}
            </div>
          </div>
          <div className={styles.row}>
            <div className={classNames(styles.half, styles.left)} data-tutorial="object-group-buttons">
              {renderToolBtn(
                tObjectPanel.group,
                <ObjectPanelIcons.Group />,
                !buttonAvailability.group,
                () => svgCanvas.groupSelectedElements(),
                'group',
              )}
              {renderToolBtn(
                tObjectPanel.ungroup,
                <ObjectPanelIcons.Ungroup />,
                !buttonAvailability.ungroup,
                () => svgCanvas.ungroupSelectedElement(),
                'ungroup',
              )}
            </div>
            <div className={classNames(styles.half, styles.right)} data-tutorial="object-boolean-buttons">
              {renderToolBtn(
                tObjectPanel.union,
                <ObjectPanelIcons.Union />,
                !buttonAvailability.union,
                async () => convertAndBooleanOperate({ element: elem as SVGGElement, operation: 'union' }),
                'union',
              )}
              {renderToolBtn(
                tObjectPanel.subtract,
                <ObjectPanelIcons.Subtract />,
                !buttonAvailability.subtract,
                async () => convertAndBooleanOperate({ element: elem as SVGGElement, operation: 'diff' }),
                'subtract',
              )}
              {renderToolBtn(
                tObjectPanel.intersect,
                <ObjectPanelIcons.Intersect />,
                !buttonAvailability.intersect,
                async () => convertAndBooleanOperate({ element: elem as SVGGElement, operation: 'intersect' }),
                'intersect',
              )}
              {renderToolBtn(
                tObjectPanel.difference,
                <ObjectPanelIcons.Diff />,
                !buttonAvailability.difference,
                async () => convertAndBooleanOperate({ element: elem as SVGGElement, operation: 'xor' }),
                'difference',
              )}
            </div>
          </div>
        </ConfigProvider>
      </div>
    );
  };

  const renderDimensionPanel = (): React.JSX.Element => {
    return <DimensionPanel elem={elem as SVGElement} />;
  };

  const renderOptionPanel = (): React.JSX.Element => {
    return <OptionsPanel elem={elem as SVGElement} />;
  };

  const renderActionPanel = (): React.JSX.Element => <ActionsPanel elem={elem as SVGElement} />;

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
