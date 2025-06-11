import React from 'react';

import classNames from 'classnames';
import { match } from 'ts-pattern';

import Constant from '@core/app/actions/beambox/constant';
import type { ToolPanelType } from '@core/app/actions/beambox/toolPanelsController';
import Dialog from '@core/app/actions/dialog-caller';
import currentFileManager from '@core/app/svgedit/currentFileManager';
import ObjectPanelController from '@core/app/views/beambox/Right-Panels/contexts/ObjectPanelController';
import ArrayModal from '@core/app/views/beambox/ToolPanels/ArrayModal';
import IntervalPanel from '@core/app/views/beambox/ToolPanels/Interval';
import NestGAPanel from '@core/app/views/beambox/ToolPanels/NestGAPanel';
import NestRotationPanel from '@core/app/views/beambox/ToolPanels/NestRotationPanel';
import NestSpacingPanel from '@core/app/views/beambox/ToolPanels/NestSpacingPanel';
import type { OffsetProp } from '@core/app/views/beambox/ToolPanels/OffsetModal';
import OffsetModal from '@core/app/views/beambox/ToolPanels/OffsetModal';
import RowColumnPanel from '@core/app/views/beambox/ToolPanels/RowColumn';
import offsetElements from '@core/helpers/clipper/offset';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import i18n from '@core/helpers/i18n';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import { isMobile } from '@core/helpers/system-helper';
import storage from '@core/implementations/storage';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import OffsetPanel from './OffsetPanel';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const drawingToolEventEmitter = eventEmitterFactory.createEventEmitter('drawing-tool');

const LANG = i18n.lang.beambox.tool_panels;

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

class ToolPanel extends React.Component<Props> {
  private offset: OffsetProp;

  private nestOptions: {
    generations: number;
    population: number;
    rotations: number;
    spacing: number;
  };

  constructor(props: any) {
    super(props);
    this._setArrayRowColumn = this._setArrayRowColumn.bind(this);
    this._setArrayDistance = this._setArrayDistance.bind(this);
    this._setOffsetMode = this._setOffsetMode.bind(this);
    this._setOffsetCorner = this._setOffsetCorner.bind(this);
    this._setOffsetDist = this._setOffsetDist.bind(this);
    this.offset = {
      cornerType: 'sharp',
      distance: 5,
      offsetMode: 'outward',
    };
    this.nestOptions = {
      generations: 3,
      population: 10,
      rotations: 1,
      spacing: 0,
    };
  }

  _setArrayRowColumn(rowColumn: any) {
    this.props.data.rowcolumn = rowColumn;
    this.setState({ rowcolumn: rowColumn });
  }

  _setArrayDistance(distance: { dx: number; dy: number }) {
    this.props.data.distance = distance;
    this.setState({ distance });
  }

  _setOffsetMode(offsetMode: OffsetProp['offsetMode']) {
    this.offset.offsetMode = offsetMode;
  }

  _setOffsetDist(val: number) {
    this.offset.distance = val;
  }

  _setOffsetCorner(val: 'round' | 'sharp') {
    this.offset.cornerType = val;
  }

  renderPanels() {
    const { data, type } = this.props;
    const validPanels = validPanelsMap[type] || validPanelsMap.unknown;
    const panels = validPanels.map((name) =>
      match(name)
        .with('rowColumn', (name) => (
          <RowColumnPanel key={name} {...data.rowcolumn} onValueChange={this._setArrayRowColumn} />
        ))
        .with('distance', (name) => (
          <IntervalPanel key={name} {...data.distance} onValueChange={this._setArrayDistance} />
        ))
        .with('offset', () => (
          <OffsetPanel
            cornerType={this.offset.cornerType}
            distance={this.offset.distance}
            key="offset"
            mode={this.offset.offsetMode}
            onCornerTypeChange={this._setOffsetCorner}
            onDistanceChange={this._setOffsetDist}
            onModeChange={this._setOffsetMode}
          />
        ))
        .with('nestOffset', (name) => (
          <NestSpacingPanel
            key={name}
            onValueChange={(val) => {
              this.nestOptions.spacing = val;
            }}
            spacing={this.nestOptions.spacing}
          />
        ))
        .with('nestGA', (name) => (
          <NestGAPanel
            key={name}
            nestOptions={this.nestOptions}
            updateNestOptions={(options) => {
              this.nestOptions = { ...this.nestOptions, ...options };
            }}
          />
        ))
        .with('nestRotation', (name) => (
          <NestRotationPanel
            key={name}
            onValueChange={(val) => {
              this.nestOptions.rotations = val;
            }}
            rotations={this.nestOptions.rotations}
          />
        ))
        .otherwise(() => undefined),
    );

    return panels;
  }

  renderTitle() {
    const { type } = this.props;
    const titleMap = { gridArray: LANG.grid_array, offset: LANG.offset };
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
  }

  _onCancel = () => {
    this.props.unmount();
    svgCanvas.setMode('select');
    drawingToolEventEmitter.emit('SET_ACTIVE_BUTTON', 'Cursor');
  };

  _getOnYes = (): (() => Promise<void> | void) => {
    const { data, type, unmount } = this.props;

    switch (type) {
      case 'gridArray':
        return async () => {
          const distance = {
            dx: _mm2pixel(data.distance.dx),
            dy: _mm2pixel(data.distance.dy),
          };

          await (svgCanvas as any).gridArraySelectedElement(distance, data.rowcolumn);
          unmount();
          svgCanvas.setMode('select');
          drawingToolEventEmitter.emit('SET_ACTIVE_BUTTON', 'Cursor');
          currentFileManager.setHasUnsavedChanges(true);
        };

      case 'offset':
        return () => {
          offsetElements(
            this.offset.offsetMode,
            _mm2pixel(this.offset.distance),
            this.offset.cornerType as 'round' | 'sharp',
          );
          unmount();
          svgCanvas.setMode('select');
          drawingToolEventEmitter.emit('SET_ACTIVE_BUTTON', 'Cursor');
          currentFileManager.setHasUnsavedChanges(true);
        };
      case 'nest':
        return () => {
          this.nestOptions.spacing *= 10; // pixel to mm
          (svgCanvas as any).nestElements(null, null, this.nestOptions);
          unmount();
          svgCanvas.setMode('select');
          drawingToolEventEmitter.emit('SET_ACTIVE_BUTTON', 'Cursor');
        };
      default:
        return () => unmount();
    }
  };

  renderButtons() {
    return (
      <div className="tool-block">
        <div className="btn-h-group">
          <button className="btn btn-default primary" onClick={this._getOnYes()} type="button">
            {LANG.confirm}
          </button>
          <button className="btn btn-default" onClick={this._onCancel} type="button">
            {LANG.cancel}
          </button>
        </div>
      </div>
    );
  }

  renderModal(): void {
    const { type, unmount } = this.props;

    if (Dialog.isIdExist(type)) {
      return;
    }

    const closeModal = () => {
      ObjectPanelController.updateActiveKey(null);
      Dialog.popDialogById(type);
    };
    const onOk = this._getOnYes();
    const onCancel = this._onCancel;

    switch (type) {
      case 'gridArray':
        Dialog.addDialogComponent(
          type,
          <ArrayModal
            onCancel={() => {
              onCancel();
              closeModal();
            }}
            onOk={async (value) => {
              this._setArrayRowColumn({ column: value.column, row: value.row });
              this._setArrayDistance({ dx: value.dx, dy: value.dy });
              await onOk();
              closeModal();
            }}
          />,
        );
        break;
      case 'offset':
        Dialog.addDialogComponent(
          type,
          <OffsetModal
            onCancel={() => {
              onCancel();
              closeModal();
            }}
            onOk={async (value) => {
              this._setOffsetMode(value.offsetMode);
              this._setOffsetDist(value.distance);
              this._setOffsetCorner(value.cornerType);
              await onOk();
              closeModal();
            }}
          />,
        );
        break;
      default:
        ObjectPanelController.updateActiveKey(null);
        unmount();
    }
  }

  _findPositionStyle() {
    return {
      bottom: 10,
      left: 50,
      position: 'absolute',
      zIndex: 999,
    } as React.CSSProperties;
  }

  render() {
    if (isMobile()) {
      this.renderModal();

      return null;
    }

    const lang = storage.get('active-lang') || 'en';
    const positionStyle = this._findPositionStyle();
    const classes = classNames('tool-panels', lang);

    return (
      <div className={classes} id="beamboxToolPanel" style={positionStyle}>
        {this.renderTitle()}
        {this.renderPanels()}
        {this.renderButtons()}
      </div>
    );
  }
}

export default ToolPanel;
