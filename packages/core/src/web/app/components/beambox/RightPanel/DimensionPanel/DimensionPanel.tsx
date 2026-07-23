import React, { memo, use, useCallback, useMemo } from 'react';

import { ConfigProvider } from 'antd';
import { match } from 'ts-pattern';

import Constant from '@core/app/actions/beambox/constant';
import Content from '@core/app/components/beambox/RightPanel/common/Content';
import ControlBlock from '@core/app/components/beambox/RightPanel/common/ControlBlock';
import { ObjectPanelItem } from '@core/app/components/beambox/RightPanel/common/ObjectPanelItem';
import { iconButtonTheme } from '@core/app/constants/antd-config';
import ObjectPanelIcons from '@core/app/icons/object-panel/ObjectPanelIcons';
import { useIsInteractionMode } from '@core/app/stores/interactionModeStore';
import { useIsTabletOrMobile } from '@core/app/stores/layoutStore';
import HistoryCommandFactory from '@core/app/svgedit/history/HistoryCommandFactory';
import undoManager from '@core/app/svgedit/history/undoManager';
import { setFitTextBBox } from '@core/app/svgedit/text/fitText';
import { isFitText } from '@core/app/svgedit/text/textedit';
import { getIsVertical } from '@core/app/svgedit/text/textedit/getters';
import { ControlType } from '@core/helpers/element/editable/base';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import SymbolMaker from '@core/helpers/symbol-helper/symbolMaker';
import useForceUpdate from '@core/helpers/use-force-update';
import useI18n from '@core/helpers/useI18n';
import type { ICommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';
import type { DimensionOrderMap, DimensionValues, SizeKey } from '@core/interfaces/ObjectPanel';
import { isPositionKey, isSizeKeyShort } from '@core/interfaces/ObjectPanel';

import { ObjectPanelContext } from '../contexts/ObjectPanelContext';

import styles from './DimensionPanel.module.scss';
import FlipButtons from './FlipButtons';
import PositionInput from './PositionInput';
import RatioLock from './RatioLock';
import RotationSection from './RotationSection';
import SizeInput from './SizeInput';
import { getValue } from './utils';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const panelMap: DimensionOrderMap = {
  ellipse: ['cx', 'cy', 'rx', 'ry'],
  g: ['x', 'y', 'w', 'h'],
  image: ['x', 'y', 'w', 'h'],
  img: ['x', 'y', 'w', 'h'],
  line: ['x1', 'y1', 'x2', 'y2'],
  path: ['x', 'y', 'w', 'h'],
  polygon: ['x', 'y', 'w', 'h'],
  rect: ['x', 'y', 'w', 'h'],
  text: ['x', 'y', 'w', 'h'],
  use: ['x', 'y', 'w', 'h'],
};

const fixedSizeMapping: { [key in SizeKey]: SizeKey } = {
  height: 'width',
  rx: 'ry',
  ry: 'rx',
  width: 'height',
};

interface Props {
  elem: null | SVGElement;
}

export const DimensionPanelContent = memo(({ elem }: Props): React.JSX.Element => {
  const { getDimensionValues, updateDimensionValues } = use(ObjectPanelContext);
  const isTablet = useIsTabletOrMobile();

  const forceUpdate = useForceUpdate();

  const handleSizeBlur = useCallback(async () => {
    if (elem?.tagName === 'use') {
      SymbolMaker.reRenderImageSymbol(elem as SVGUseElement);
    } else if (elem?.tagName === 'g') {
      const allUses = Array.from(elem.querySelectorAll('use'));

      SymbolMaker.reRenderImageSymbolArray(allUses);
    }
  }, [elem]);
  const isFitTextElem = useMemo(() => {
    if (!elem) return false;

    return isFitText(elem);
  }, [elem]);

  const getDisabledSizeKeys = useCallback((): Set<'h' | 'w'> => {
    const disabled = new Set<'h' | 'w'>();

    if (!elem) return disabled;

    const fitTextElems = [elem, ...elem.querySelectorAll('text')].filter((e) => isFitText(e)) as SVGTextElement[];

    for (const text of fitTextElems) {
      if (disabled.has('h') && disabled.has('w')) {
        break;
      }

      disabled.add(getIsVertical(text) ? 'w' : 'h');
    }

    return disabled;
  }, [elem]);

  const handlePositionChange = useCallback(
    (type: string, val: number): void => {
      if (!elem) return;

      const posVal = val * Constant.dpmm;

      if (!['text', 'use'].includes(elem.tagName)) {
        svgCanvas.changeSelectedAttribute(type, posVal, [elem]);
      } else {
        svgCanvas.setSvgElemPosition(type as 'x' | 'y', posVal, elem);
      }

      updateDimensionValues({ [type]: posVal });
      forceUpdate();
    },
    [elem, updateDimensionValues, forceUpdate],
  );

  const changeSize = useCallback(
    (type: SizeKey, val: number): ICommand | null => {
      const elemSize = val > 0.1 ? val : 0.1;
      let cmd: ICommand | null = null;

      match(elem?.tagName)
        .with('ellipse', 'rect', 'image', () => {
          undoManager.beginUndoableChange(type, [elem!]);
          svgCanvas.changeSelectedAttributeNoUndo(type, elemSize, [elem!]);

          const batchCmd = undoManager.finishUndoableChange();

          cmd = batchCmd.isEmpty() ? null : batchCmd;
        })
        .with('g', 'polygon', 'path', 'text', 'use', (tag) => {
          if (tag === 'text' && isFitText(elem!)) {
            cmd = setFitTextBBox(elem as SVGTextElement, { [type]: elemSize }, { addToHistory: false });
          } else {
            const batchCmd = svgCanvas.setSvgElemSize(type, elemSize);

            cmd = batchCmd?.isEmpty() ? null : batchCmd;
          }
        })
        .otherwise(() => {});

      return cmd;
    },
    [elem],
  );

  const handleSizeChange = useCallback(
    (type: SizeKey, val: number): void => {
      const batchCmd = HistoryCommandFactory.createBatchCommand('Object Panel Size Change');
      const response = {
        dimensionValues: {} as DimensionValues,
      };

      getDimensionValues(response);

      const { dimensionValues } = response;
      const isRatioFixed = dimensionValues.isRatioFixed || false;
      const sizeVal = val * Constant.dpmm;

      let cmd = changeSize(type, sizeVal);

      if (cmd) {
        batchCmd.addSubCommand(cmd);
      }

      const newValues = { [type]: sizeVal };

      if (isRatioFixed) {
        const ratio = sizeVal / dimensionValues[type]!;
        const counterPart = fixedSizeMapping[type];
        const newCounterPartVal = ratio * dimensionValues[counterPart]!;

        cmd = changeSize(counterPart, newCounterPartVal);

        if (cmd) {
          batchCmd.addSubCommand(cmd);
        }

        newValues[counterPart] = newCounterPartVal;
      }

      updateDimensionValues(newValues);

      if (batchCmd && !batchCmd.isEmpty()) {
        undoManager.addCommandToHistory(batchCmd);
      }

      forceUpdate();
    },
    [changeSize, getDimensionValues, updateDimensionValues, forceUpdate],
  );

  const handleFixRatio = useCallback((): void => {
    const isRatioFixed = elem?.getAttribute('data-ratiofixed') === 'true';

    if (elem) {
      svgCanvas.changeSelectedAttribute('data-ratiofixed', String(!isRatioFixed), [elem]);
    }

    updateDimensionValues({ isRatioFixed: !isRatioFixed });
    forceUpdate();
  }, [elem, updateDimensionValues, forceUpdate]);

  const response = { dimensionValues: {} as DimensionValues };

  getDimensionValues(response);

  const { dimensionValues } = response;
  const disabledSizeKeys = getDisabledSizeKeys();

  const renderBlock = (type: string): React.ReactNode => {
    if (isPositionKey(type)) {
      return (
        <PositionInput
          key={type}
          onChange={handlePositionChange}
          type={type}
          value={getValue(dimensionValues, type, { unit: 'mm' })}
        />
      );
    }

    if (isSizeKeyShort(type)) {
      return (
        <SizeInput
          disabled={disabledSizeKeys.has(type as 'h' | 'w')}
          key={type}
          onBlur={handleSizeBlur}
          onChange={handleSizeChange}
          type={type}
          value={getValue(dimensionValues, type, { unit: 'mm' })}
        />
      );
    }

    if (type === 'lock' && !isFitTextElem) {
      return <RatioLock isLocked={dimensionValues.isRatioFixed || false} key="lock" onClick={handleFixRatio} />;
    }

    if (type === 'placeholder') {
      return <div className={styles.placeholder} />;
    }

    return null;
  };
  const tagName = elem?.tagName.toLowerCase() ?? '';
  const isMultiSelect = elem?.getAttribute('data-tempgroup') === 'true';
  const isProjectMode = useIsInteractionMode('project');
  const panels: string[][] = useMemo(() => {
    const defaultPanels: string[] = panelMap[tagName] || ['x', 'y', 'w', 'h'];

    if (isTablet) {
      // For tablet, editable buttons won't effect width
      // Add placeholder if with lock button
      if (isFitTextElem) {
        return [
          [defaultPanels[0], defaultPanels[1]],
          [defaultPanels[2], defaultPanels[3]],
        ];
      } else {
        return [
          [defaultPanels[0], 'placeholder', defaultPanels[1]],
          [defaultPanels[2], 'lock', defaultPanels[3]],
        ];
      }
    }

    if (isFitTextElem) {
      if (isProjectMode) {
        // For fit text in project mode, 0, 1, 2+3 have one editable button after input, without lock button
        // Add placeholder to align with editable button of 0
        return [
          [defaultPanels[0], defaultPanels[1]],
          [defaultPanels[2], 'placeholder', defaultPanels[3]],
        ];
      } else {
        // For fit text in non-project mode, no editable button nor lock button
        // Add placeholder for both rows to add proper space between inputs
        return [
          [defaultPanels[0], 'placeholder', defaultPanels[1]],
          [defaultPanels[2], 'placeholder', defaultPanels[3]],
        ];
      }
    } else if (!isProjectMode || isMultiSelect || tagName === 'line') {
      // For non-project mode Or temp group, 0~3 have no editable button
      // For line, 0~3 have one editable button after input
      // Add placeholder to align with lock
      return [
        [defaultPanels[0], 'placeholder', defaultPanels[1]],
        [defaultPanels[2], 'lock', defaultPanels[3]],
      ];
    }

    // Fallback case: assuming 0, 1, 2+3 have one editable button after input, with lock button
    // No need to add placeholder
    return [
      [defaultPanels[0], defaultPanels[1]],
      [defaultPanels[2], 'lock', defaultPanels[3]],
    ];
  }, [isProjectMode, tagName, isMultiSelect, isFitTextElem, isTablet]);

  return (
    <>
      <div className={styles.section}>
        {panels.map((row, index) => {
          const contents = row.map((type) => <React.Fragment key={type}>{renderBlock(type)}</React.Fragment>);

          return isSizeKeyShort(row[0]) ? (
            <ControlBlock
              className={styles.row}
              forceVisible
              position={isTablet ? 'top-right' : 'default'}
              type={ControlType._SIZE}
            >
              {contents}
            </ControlBlock>
          ) : (
            <div className={styles.row} key={index}>
              {contents}
            </div>
          );
        })}
      </div>
      <div className={styles.row}>
        <RotationSection dimensionValues={dimensionValues} elem={elem!} forceUpdate={forceUpdate} />
      </div>
      <div className={styles.row}>
        <FlipButtons />
      </div>
    </>
  );
});

const DimensionPanel = ({ elem }: Props): React.JSX.Element => {
  const title = useI18n().beambox.right_panel.object_panel.sections.transform;
  const isTablet = useIsTabletOrMobile();

  return isTablet ? (
    <ObjectPanelItem
      icon={<ObjectPanelIcons.Transform />}
      id="dimension"
      renderContent={() => (
        <Content>
          <DimensionPanelContent elem={elem} />
        </Content>
      )}
      title={title}
    />
  ) : (
    <div className={styles.panel}>
      <ConfigProvider theme={iconButtonTheme}>
        <DimensionPanelContent elem={elem} />
      </ConfigProvider>
    </div>
  );
};

export default DimensionPanel;
