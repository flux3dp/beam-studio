import React from 'react';

import classNames from 'classnames';

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
import OffsetCornerPanel from '@core/app/views/beambox/ToolPanels/OffsetCornerPanel';
import OffsetDirectionPanel from '@core/app/views/beambox/ToolPanels/OffsetDirectionPanel';
import OffsetDistancePanel from '@core/app/views/beambox/ToolPanels/OffsetDistancePanel';
import OffsetModal from '@core/app/views/beambox/ToolPanels/OffsetModal';
import RowColumnPanel from '@core/app/views/beambox/ToolPanels/RowColumn';
import offsetElements from '@core/helpers/clipper/offset';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import i18n from '@core/helpers/i18n';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import { isMobile } from '@core/helpers/system-helper';
import storage from '@core/implementations/storage';

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
  gridArray: ['rowColumn', 'distance'],
  nest: ['nestOffset', 'nestRotation', 'nestGA'],
  offset: ['offsetDir', 'offsetCorner', 'offsetDist'],
  unknown: [],
};

interface Props {
  data: any;
  type: ToolPanelType;
  unmount: () => void;
}

class ToolPanel extends React.Component<Props> {
  private offset: {
    cornerType: string;
    dir: number;
    distance: number;
  };

  private nestOptions: {
    generations: number;
    population: number;
    rotations: number;
    spacing: number;
  };

  constructor(props) {
    super(props);
    this._setArrayRowColumn = this._setArrayRowColumn.bind(this);
    this._setArrayDistance = this._setArrayDistance.bind(this);
    this._setOffsetDir = this._setOffsetDir.bind(this);
    this._setOffsetCorner = this._setOffsetCorner.bind(this);
    this._setOffsetDist = this._setOffsetDist.bind(this);
    this.offset = {
      cornerType: 'sharp',
      dir: 1, // 1 for outward, 0 for inward
      distance: 5,
    };
    this.nestOptions = {
      generations: 3,
      population: 10,
      rotations: 1,
      spacing: 0,
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
          panel = <RowColumnPanel key={panelName} {...data.rowcolumn} onValueChange={this._setArrayRowColumn} />;
          break;
        case 'distance':
          panel = <IntervalPanel key={panelName} {...data.distance} onValueChange={this._setArrayDistance} />;
          break;
        case 'offsetDir':
          panel = <OffsetDirectionPanel dir={this.offset.dir} key={panelName} onValueChange={this._setOffsetDir} />;
          break;
        case 'offsetCorner':
          panel = (
            <OffsetCornerPanel
              cornerType={this.offset.cornerType}
              key={panelName}
              onValueChange={this._setOffsetCorner}
            />
          );
          break;
        case 'offsetDist':
          panel = (
            <OffsetDistancePanel distance={this.offset.distance} key={panelName} onValueChange={this._setOffsetDist} />
          );
          break;
        case 'nestOffset':
          panel = (
            <NestSpacingPanel
              key={panelName}
              onValueChange={(val) => {
                this.nestOptions.spacing = val;
              }}
              spacing={this.nestOptions.spacing}
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
              onValueChange={(val) => {
                this.nestOptions.rotations = val;
              }}
              rotations={this.nestOptions.rotations}
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

          await svgCanvas.gridArraySelectedElement(distance, data.rowcolumn);
          unmount();
          svgCanvas.setMode('select');
          drawingToolEventEmitter.emit('SET_ACTIVE_BUTTON', 'Cursor');
          currentFileManager.setHasUnsavedChanges(true);
        };

      case 'offset':
        return () => {
          offsetElements(this.offset.dir, _mm2pixel(this.offset.distance), this.offset.cornerType as 'round' | 'sharp');
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
              this._setOffsetDir(value.dir);
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
