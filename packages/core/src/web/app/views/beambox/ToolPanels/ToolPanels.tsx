import React, { useEffect, useRef, useState } from 'react';

import classNames from 'classnames';
import { match } from 'ts-pattern';

import Constant from '@core/app/actions/beambox/constant';
import type { ToolPanelType } from '@core/app/actions/beambox/toolPanelsController';
import Dialog from '@core/app/actions/dialog-caller';
import { setMouseMode } from '@core/app/stores/canvas/utils/mouseMode';
import { useStorageStore } from '@core/app/stores/storageStore';
import currentFileManager from '@core/app/svgedit/currentFileManager';
import { generateSelectedElementArray } from '@core/app/svgedit/operations/clipboard';
import ObjectPanelController from '@core/app/views/beambox/Right-Panels/contexts/ObjectPanelController';
import ArrayModal from '@core/app/views/beambox/ToolPanels/ArrayModal';
import IntervalPanel from '@core/app/views/beambox/ToolPanels/Interval';
import NestGAPanel from '@core/app/views/beambox/ToolPanels/NestGAPanel';
import NestRotationPanel from '@core/app/views/beambox/ToolPanels/NestRotationPanel';
import NestSpacingPanel from '@core/app/views/beambox/ToolPanels/NestSpacingPanel';
import OffsetModal from '@core/app/views/beambox/ToolPanels/OffsetModal';
import RowColumnPanel from '@core/app/views/beambox/ToolPanels/RowColumn';
import offsetElements from '@core/helpers/clipper/offset';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import { isMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import type { OffsetProp } from './OffsetPanel';
import OffsetPanel from './OffsetPanel';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const drawingToolEventEmitter = eventEmitterFactory.createEventEmitter('drawing-tool');

const _mm2pixel = (pixel_input: number) => {
  const { dpmm } = Constant;

  return Number(pixel_input * dpmm);
};

const validPanelsMap = {
  gridArray: ['rowColumn', 'distance'],
  nest: ['nestOffset', 'nestRotation', 'nestGA'],
  offset: ['offset'],
  unknown: [],
};

interface Props {
  data: any;
  type: ToolPanelType;
  unmount: () => void;
}

const ToolPanel: React.FC<Props> = ({ data, type, unmount }) => {
  const lang = useI18n().beambox.tool_panels;
  const activeLang = useStorageStore((state) => state['active-lang']) ?? 'en';

  const [rowColumn, setRowColumn] = useState(data.rowcolumn);
  const [distance, setDistance] = useState(data.distance);
  const [offset, setOffset] = useState<OffsetProp>({ cornerType: 'sharp', distance: 5, mode: 'outward' });

  const nestOptions = useRef({
    generations: 3,
    population: 10,
    rotations: 1,
    spacing: 0,
  }).current;

  const setArrayRowColumn = (newRowColumn: any) => {
    data.rowcolumn = newRowColumn;
    setRowColumn(newRowColumn);
  };

  const setArrayDistance = (newDistance: { dx: number; dy: number }) => {
    data.distance = newDistance;
    setDistance(newDistance);
  };

  const onCancel = () => {
    unmount();
    setMouseMode('select');
    drawingToolEventEmitter.emit('SET_ACTIVE_BUTTON', 'Cursor');
  };

  const generateOnOk = (newOffset?: OffsetProp): (() => Promise<void> | void) =>
    match(type)
      .with('gridArray', () => {
        const newDistance = {
          dx: _mm2pixel(data.distance.dx),
          dy: _mm2pixel(data.distance.dy),
        };

        return async () => {
          await generateSelectedElementArray(newDistance, data.rowcolumn);
          unmount();
          setMouseMode('select');
          drawingToolEventEmitter.emit('SET_ACTIVE_BUTTON', 'Cursor');
          currentFileManager.setHasUnsavedChanges(true);
        };
      })
      .with('offset', () => async () => {
        const { cornerType, distance, mode } = newOffset || offset;

        await offsetElements(mode, _mm2pixel(distance), cornerType);
        unmount();
        setMouseMode('select');
        drawingToolEventEmitter.emit('SET_ACTIVE_BUTTON', 'Cursor');
        currentFileManager.setHasUnsavedChanges(true);
      })
      .with('nest', () => () => {
        nestOptions.spacing *= 10; // pixel to mm
        (svgCanvas as any).nestElements(null, null, nestOptions);
        unmount();
        setMouseMode('select');
        drawingToolEventEmitter.emit('SET_ACTIVE_BUTTON', 'Cursor');
      })
      .otherwise(() => unmount);

  const findPositionStyle = () => {
    return { bottom: 10, left: 50, position: 'absolute', zIndex: 999 } as React.CSSProperties;
  };

  useEffect(() => {
    if (!isMobile() || Dialog.isIdExist(type)) return;

    const closeModal = () => {
      ObjectPanelController.updateActiveKey(null);
      Dialog.popDialogById(type);
    };

    match(type)
      .with('gridArray', () =>
        Dialog.addDialogComponent(
          type,
          <ArrayModal
            onCancel={() => {
              onCancel();
              closeModal();
            }}
            onOk={async (value) => {
              setArrayRowColumn({ column: value.column, row: value.row });
              setArrayDistance({ dx: value.dx, dy: value.dy });
              await generateOnOk()();
              closeModal();
            }}
          />,
        ),
      )
      .with('offset', () =>
        Dialog.addDialogComponent(
          type,
          <OffsetModal
            onCancel={() => {
              onCancel();
              closeModal();
            }}
            onOk={async (offset) => {
              setOffset(offset);
              await generateOnOk(offset)();
              closeModal();
            }}
          />,
        ),
      )
      .otherwise(() => {
        ObjectPanelController.updateActiveKey(null);
        unmount();
      });
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [type, unmount]);

  if (isMobile()) {
    return null;
  }

  const renderPanels = () => {
    const validPanels = validPanelsMap[type] || validPanelsMap.unknown;

    return validPanels.map((name) =>
      match(name)
        .with('rowColumn', (name) => <RowColumnPanel key={name} {...rowColumn} onValueChange={setArrayRowColumn} />)
        .with('distance', (name) => <IntervalPanel key={name} {...distance} onValueChange={setArrayDistance} />)
        .with('offset', () => (
          <OffsetPanel
            key="offset"
            offset={offset}
            setCornerType={(cornerType) => setOffset((prev) => ({ ...prev, cornerType }))}
            setDistance={(distance) => setOffset((prev) => ({ ...prev, distance }))}
            setMode={(mode) => setOffset((prev) => ({ ...prev, mode }))}
          />
        ))
        .with('nestOffset', (name) => (
          <NestSpacingPanel
            key={name}
            onValueChange={(val) => {
              nestOptions.spacing = val;
            }}
            spacing={nestOptions.spacing}
          />
        ))
        .with('nestGA', (name) => (
          <NestGAPanel
            key={name}
            nestOptions={nestOptions}
            updateNestOptions={(options) => {
              Object.assign(nestOptions, options);
            }}
          />
        ))
        .with('nestRotation', (name) => (
          <NestRotationPanel
            key={name}
            onValueChange={(val) => {
              nestOptions.rotations = val;
            }}
            rotations={nestOptions.rotations}
          />
        ))
        .otherwise(() => undefined),
    );
  };

  const renderTitle = () => {
    const titleMap = { gridArray: lang.grid_array, offset: lang.offset };
    const title = titleMap[type as 'gridArray' | 'offset'];

    return (
      <div className="tool-panel">
        <label className="controls accordion">
          <input className="accordion-switcher" defaultChecked type="checkbox" />
          <p className="caption">
            <span className="value">{title}</span>
          </p>
        </label>
      </div>
    );
  };

  const renderButtons = () => {
    return (
      <div className="tool-block">
        <div className="btn-h-group">
          <button className="btn btn-default primary" onClick={generateOnOk()} type="button">
            {lang.confirm}
          </button>
          <button className="btn btn-default" onClick={onCancel} type="button">
            {lang.cancel}
          </button>
        </div>
      </div>
    );
  };

  const positionStyle = findPositionStyle();

  return (
    <div className={classNames('tool-panels', activeLang)} id="beamboxToolPanel" style={positionStyle}>
      {renderTitle()}
      {renderPanels()}
      {renderButtons()}
    </div>
  );
};

export default ToolPanel;
