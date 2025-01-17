/* eslint-disable react/no-unused-state */
/* eslint-disable react/sort-comp */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable no-underscore-dangle */
import classNames from 'classnames';
import React from 'react';

import ArrayModal from 'app/views/beambox/ToolPanels/ArrayModal';
import Constant from 'app/actions/beambox/constant';
import currentFileManager from 'app/svgedit/currentFileManager';
import Dialog from 'app/actions/dialog-caller';
import eventEmitterFactory from 'helpers/eventEmitterFactory';
import i18n from 'helpers/i18n';
import IntervalPanel from 'app/views/beambox/ToolPanels/Interval';
import NestGAPanel from 'app/views/beambox/ToolPanels/NestGAPanel';
import NestRotationPanel from 'app/views/beambox/ToolPanels/NestRotationPanel';
import NestSpacingPanel from 'app/views/beambox/ToolPanels/NestSpacingPanel';
import ObjectPanelController from 'app/views/beambox/Right-Panels/contexts/ObjectPanelController';
import OffsetCornerPanel from 'app/views/beambox/ToolPanels/OffsetCornerPanel';
import OffsetDirectionPanel from 'app/views/beambox/ToolPanels/OffsetDirectionPanel';
import OffsetDistancePanel from 'app/views/beambox/ToolPanels/OffsetDistancePanel';
import OffsetModal from 'app/views/beambox/ToolPanels/OffsetModal';
import offsetElements from 'helpers/clipper/offset';
import RowColumnPanel from 'app/views/beambox/ToolPanels/RowColumn';
import storage from 'implementations/storage';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { isMobile } from 'helpers/system-helper';
import { ToolPanelType } from 'app/actions/beambox/toolPanelsController';

let svgCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const drawingToolEventEmitter = eventEmitterFactory.createEventEmitter('drawing-tool');

const LANG = i18n.lang.beambox.tool_panels;

const _mm2pixel = (pixel_input) => {
  const { dpmm } = Constant;
  return Number(pixel_input * dpmm);
};

const validPanelsMap = {
  unknown: [],
  gridArray: ['rowColumn', 'distance'],
  offset: ['offsetDir', 'offsetCorner', 'offsetDist'],
  nest: ['nestOffset', 'nestRotation', 'nestGA'],
};

interface Props {
  type: ToolPanelType;
  data: any;
  unmount: () => void;
}

class ToolPanel extends React.Component<Props> {
  private offset: {
    dir: number;
    distance: number;
    cornerType: string;
  };

  private nestOptions: {
    spacing: number;
    generations: number;
    population: number;
    rotations: number;
  };

  constructor(props) {
    super(props);
    this._setArrayRowColumn = this._setArrayRowColumn.bind(this);
    this._setArrayDistance = this._setArrayDistance.bind(this);
    this._setOffsetDir = this._setOffsetDir.bind(this);
    this._setOffsetCorner = this._setOffsetCorner.bind(this);
    this._setOffsetDist = this._setOffsetDist.bind(this);
    this.offset = {
      dir: 1, // 1 for outward, 0 for inward
      distance: 5,
      cornerType: 'sharp',
    };
    this.nestOptions = {
      spacing: 0,
      generations: 3,
      population: 10,
      rotations: 1,
    };
  }

  _setArrayRowColumn(rowcolumn) {
    this.props.data.rowcolumn = rowcolumn;
    this.setState({ rowcolumn });
  }

  _setArrayDistance(distance) {
    this.props.data.distance = distance;
    this.setState({ distance });
  }

  _setOffsetDir(dir) {
    this.offset.dir = dir;
  }

  _setOffsetDist(val) {
    this.offset.distance = val;
  }

  _setOffsetCorner(val) {
    this.offset.cornerType = val;
  }

  renderPanels() {
    const { data, type } = this.props;
    const validPanels = validPanelsMap[type] || validPanelsMap.unknown;
    const panelsToBeRender = [];

    for (let i = 0; i < validPanels.length; ++i) {
      const panelName = validPanels[i];
      let panel;
      switch (panelName) {
        case 'rowColumn':
          panel = (
            <RowColumnPanel
              key={panelName}
              {...data.rowcolumn}
              onValueChange={this._setArrayRowColumn}
            />
          );
          break;
        case 'distance':
          panel = (
            <IntervalPanel
              key={panelName}
              {...data.distance}
              onValueChange={this._setArrayDistance}
            />
          );
          break;
        case 'offsetDir':
          panel = (
            <OffsetDirectionPanel
              key={panelName}
              dir={this.offset.dir}
              onValueChange={this._setOffsetDir}
            />
          );
          break;
        case 'offsetCorner':
          panel = (
            <OffsetCornerPanel
              key={panelName}
              cornerType={this.offset.cornerType}
              onValueChange={this._setOffsetCorner}
            />
          );
          break;
        case 'offsetDist':
          panel = (
            <OffsetDistancePanel
              key={panelName}
              distance={this.offset.distance}
              onValueChange={this._setOffsetDist}
            />
          );
          break;
        case 'nestOffset':
          panel = (
            <NestSpacingPanel
              key={panelName}
              spacing={this.nestOptions.spacing}
              onValueChange={(val) => {
                this.nestOptions.spacing = val;
              }}
            />
          );
          break;
        case 'nestGA':
          panel = (
            <NestGAPanel
              key={panelName}
              nestOptions={this.nestOptions}
              updateNestOptions={(options) => {
                this.nestOptions = { ...this.nestOptions, ...options };
              }}
            />
          );
          break;
        case 'nestRotation':
          panel = (
            <NestRotationPanel
              key={panelName}
              rotations={this.nestOptions.rotations}
              onValueChange={(val) => {
                this.nestOptions.rotations = val;
              }}
            />
          );
          break;
        default:
          break;
      }
      panelsToBeRender.push(panel);
    }
    return panelsToBeRender;
  }

  renderTitle() {
    const { type } = this.props;
    const titleMap = {
      gridArray: LANG.grid_array,
      offset: LANG.offset,
    };
    const title = titleMap[type];
    return (
      <div className="tool-panel">
        <label className="controls accordion">
          <input type="checkbox" className="accordion-switcher" defaultChecked />
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

          await svgCanvas.gridArraySelectedElement(distance, data.rowcolumn);
          unmount();
          svgCanvas.setMode('select');
          drawingToolEventEmitter.emit('SET_ACTIVE_BUTTON', 'Cursor');
          currentFileManager.setHasUnsavedChanges(true);
        };

      case 'offset':
        return () => {
          offsetElements(
            this.offset.dir,
            _mm2pixel(this.offset.distance),
            this.offset.cornerType as 'sharp' | 'round'
          );
          unmount();
          svgCanvas.setMode('select');
          drawingToolEventEmitter.emit('SET_ACTIVE_BUTTON', 'Cursor');
          currentFileManager.setHasUnsavedChanges(true);
        };
      case 'nest':
        return () => {
          this.nestOptions.spacing *= 10; // pixel to mm
          svgCanvas.nestElements(null, null, this.nestOptions);
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
          <button type="button" className="btn btn-default primary" onClick={this._getOnYes()}>
            {LANG.confirm}
          </button>
          <button type="button" className="btn btn-default" onClick={this._onCancel}>
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
              this._setArrayRowColumn({ row: value.row, column: value.column });
              this._setArrayDistance({ dx: value.dx, dy: value.dy });
              await onOk();
              closeModal();
            }}
          />
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
              this._setOffsetDir(value.dir);
              this._setOffsetDist(value.distance);
              this._setOffsetCorner(value.cornerType);
              await onOk();
              closeModal();
            }}
          />
        );
        break;
      default:
        ObjectPanelController.updateActiveKey(null);
        unmount();
    }
  }

  _findPositionStyle() {
    return {
      position: 'absolute',
      zIndex: 999,
      bottom: 10,
      left: 50,
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
      <div id="beamboxToolPanel" className={classes} style={positionStyle}>
        {this.renderTitle()}
        {this.renderPanels()}
        {this.renderButtons()}
      </div>
    );
  }
}

export default ToolPanel;
