import React, { useCallback, useMemo } from 'react';

import { ConfigProvider } from 'antd';

import Constant from '@core/app/actions/beambox/constant';
import { iconButtonTheme } from '@core/app/constants/antd-config';
import HistoryCommandFactory from '@core/app/svgedit/history/HistoryCommandFactory';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import SymbolMaker from '@core/helpers/symbol-maker';
import { useIsMobile } from '@core/helpers/system-helper';
import useForceUpdate from '@core/helpers/use-force-update';
import type { IBatchCommand } from '@core/interfaces/IHistory';

import styles from './DimensionPanel.module.scss';
import FlipButtons from './FlipButtons';
import PositionInput from './PositionInput';
import RatioLock from './RatioLock';
import Rotation from './Rotation';
import SizeInput from './SizeInput';
import { getValue } from './utils';

let svgCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const panelMap = {
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

const panelMapMobile = {
  ellipse: ['rx', 'lock', 'ry', 'rot', 'cx', 'cy'],
  g: ['w', 'lock', 'h', 'rot', 'x', 'y'],
  image: ['w', 'lock', 'h', 'rot', 'x', 'y'],
  img: ['w', 'lock', 'h', 'rot', 'x', 'y'],
  line: ['x1', 'y1', 'lock', 'x2', 'y2', 'rot'],
  path: ['w', 'lock', 'h', 'rot', 'x', 'y'],
  polygon: ['w', 'lock', 'h', 'rot', 'x', 'y'],
  rect: ['w', 'lock', 'h', 'rot', 'x', 'y'],
  text: ['w', 'lock', 'h', 'rot', 'x', 'y'],
  use: ['w', 'lock', 'h', 'rot', 'x', 'y'],
};

const fixedSizeMapping = {
  height: 'width',
  rx: 'ry',
  ry: 'rx',
  width: 'height',
};

interface Props {
  elem: Element;
  getDimensionValues: (response: { dimensionValues: { [key: string]: number } }) => void;
  updateDimensionValues: (newDimensionValue: { [key: string]: any }) => void;
}

const DimensionPanel = ({ elem, getDimensionValues, updateDimensionValues }: Props): React.JSX.Element => {
  const isMobile = useIsMobile();
  const positionKeys = useMemo(() => new Set(['x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy']), []);
  const sizeKeys = useMemo(() => new Set(['w', 'h', 'rx', 'ry']), []);

  const forceUpdate = useForceUpdate();

  const handleSizeBlur = useCallback(async () => {
    if (elem?.tagName === 'use') {
      SymbolMaker.reRenderImageSymbol(elem as SVGUseElement);
    } else if (elem?.tagName === 'g') {
      const allUses = Array.from(elem.querySelectorAll('use'));

      SymbolMaker.reRenderImageSymbolArray(allUses);
    }
  }, [elem]);

  const handlePositionChange = useCallback(
    (type: string, val: number): void => {
      const posVal = val * Constant.dpmm;

      if (!['text', 'use'].includes(elem?.tagName)) {
        svgCanvas.changeSelectedAttribute(type, posVal, [elem]);
      } else {
        svgCanvas.setSvgElemPosition(type, posVal, elem);
      }

      updateDimensionValues({ [type]: posVal });
      forceUpdate();
    },
    [elem, updateDimensionValues, forceUpdate],
  );

  const handleRotationChange = useCallback(
    (val: number, addToHistory = false): void => {
      let rotationDeg = val % 360;

      if (rotationDeg > 180) {
        rotationDeg -= 360;
      }

      if (elem.getAttribute('data-tempgroup') === 'true' && !addToHistory) {
        svgCanvas.setRotationAngle(rotationDeg, true, elem);
        updateDimensionValues({ rotation: rotationDeg });
      } else {
        svgCanvas.setRotationAngle(rotationDeg, false, elem);
      }

      forceUpdate();
    },
    [elem, forceUpdate, updateDimensionValues],
  );

  const changeSize = useCallback(
    (type: string, val: number): IBatchCommand => {
      const elemSize = val > 0.1 ? val : 0.1;
      let cmd = null;

      switch (elem?.tagName) {
        case 'ellipse':
        case 'rect':
        case 'image':
          svgCanvas.undoMgr.beginUndoableChange(type, [elem]);
          svgCanvas.changeSelectedAttributeNoUndo(type, elemSize, [elem]);
          cmd = svgCanvas.undoMgr.finishUndoableChange();
          break;
        case 'g':
        case 'polygon':
        case 'path':
        case 'text':
        case 'use':
          cmd = svgCanvas.setSvgElemSize(type, elemSize);
          break;
        default:
          break;
      }

      if (elem?.tagName === 'text') {
        elem?.setAttribute('stroke-width', elem.getAttribute('stroke-width') === '2' ? '2.01' : '2');
      }

      return cmd;
    },
    [elem],
  );

  const handleSizeChange = useCallback(
    (type: 'height' | 'rx' | 'ry' | 'width', val: number): void => {
      const batchCmd = HistoryCommandFactory.createBatchCommand('Object Panel Size Change');
      const response = {
        dimensionValues: {} as { [key: string]: number },
      };

      getDimensionValues(response);

      const { dimensionValues } = response;
      const isRatioFixed = dimensionValues.isRatioFixed || false;
      const sizeVal = val * Constant.dpmm;

      let cmd = changeSize(type, sizeVal);

      if (cmd && !cmd.isEmpty()) {
        batchCmd.addSubCommand(cmd);
      }

      const newValues = { [type]: sizeVal };

      if (isRatioFixed) {
        const ratio = sizeVal / dimensionValues[type];
        const counterPart = fixedSizeMapping[type];
        const newCounterPartVal = ratio * dimensionValues[counterPart];

        cmd = changeSize(counterPart, newCounterPartVal);

        if (cmd && !cmd.isEmpty()) {
          batchCmd.addSubCommand(cmd);
        }

        newValues[counterPart] = newCounterPartVal;
      }

      updateDimensionValues(newValues);

      if (batchCmd && !batchCmd.isEmpty()) {
        svgCanvas.undoMgr.addCommandToHistory(batchCmd);
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

  const response = { dimensionValues: {} as any };

  getDimensionValues(response);

  const { dimensionValues } = response;

  const renderBlock = (type: string): React.JSX.Element => {
    if (positionKeys.has(type)) {
      return (
        <PositionInput
          key={type}
          onChange={handlePositionChange}
          type={type as 'cx' | 'cy' | 'x1' | 'x2' | 'x' | 'y1' | 'y2' | 'y'}
          value={getValue(dimensionValues, type, { unit: 'mm' })}
        />
      );
    }

    if (sizeKeys.has(type)) {
      return (
        <SizeInput
          key={type}
          onBlur={handleSizeBlur}
          onChange={handleSizeChange}
          type={type as 'h' | 'rx' | 'ry' | 'w'}
          value={getValue(dimensionValues, type, { unit: 'mm' })}
        />
      );
    }

    if (type === 'rot') {
      return <Rotation key="rot" onChange={handleRotationChange} value={dimensionValues.rotation} />;
    }

    if (type === 'lock') {
      return <RatioLock isLocked={dimensionValues.isRatioFixed || false} key="lock" onClick={handleFixRatio} />;
    }

    return null;
  };
  const panels: string[] = (isMobile ? panelMapMobile : panelMap)[elem?.tagName.toLowerCase()] || ['x', 'y', 'w', 'h'];
  const contents = [];

  panels.forEach((type) => {
    contents.push(renderBlock(type));
  });

  return isMobile ? (
    <div className={styles.container}>
      <ObjectPanelItem.Divider />
      {contents}
      <FlipButtons />
    </div>
  ) : (
    <div className={styles.panel}>
      <ConfigProvider theme={iconButtonTheme}>
        <div className={styles.row}>
          <div className={styles.dimensions}>{contents}</div>
          {renderBlock('lock')}
        </div>
        <div className={styles.row}>
          {renderBlock('rot')}
          <FlipButtons />
        </div>
      </ConfigProvider>
    </div>
  );
};

export default DimensionPanel;
