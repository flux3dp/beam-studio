/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/mouse-events-have-key-events,
jsx-a11y/no-static-element-interactions, react/static-property-placement, no-underscore-dangle */
import Alert from 'app/actions/alert-caller';
import Dialog from 'app/actions/dialog-caller';
import AlertConstants from 'app/constants/alert-constants';
import TutorialConstants from 'app/constants/tutorial-constants';
import { initLayerConfig, cloneLayerConfig } from 'helpers/laser-config-helper';
import {
  getLayerElementByName,
  deleteLayers,
  cloneSelectedLayers,
  setLayersLock,
  mergeSelectedLayers,
  moveLayersToPosition,
} from 'helpers/layer-helper';
import * as i18n from 'helpers/i18n';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { ILayerPanelContext } from 'interfaces/IContext';
import { LayerPanelContext } from './contexts/LayerPanelContext';
import LaserPanel from './Laser-Panel';
import ColorPickerPanel from '../Color-Picker-Panel';
import * as TutorialController from '../../tutorials/Tutorial-Controller';

let svgCanvas;
let svgEditor;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
  svgEditor = globalSVG.Editor;
});

const React = requireNode('react');
const classNames = requireNode('classnames');
const { ContextMenu, MenuItem, ContextMenuTrigger } = requireNode('react-contextmenu');
const PropTypes = requireNode('prop-types');
const LANG = i18n.lang.beambox.right_panel.layer_panel;
let contextCaller;

export const ContextHelper = {
  get context(): ILayerPanelContext {
    return contextCaller;
  },
};

export class LayerPanel extends React.Component {
  private context: ILayerPanelContext;

  constructor() {
    super();
    this.state = {
      colorPanelLayer: null,
      colorPanelLeft: null,
      colorPanelTop: null,
    };
  }

  componentDidMount(): void {
    contextCaller = this.context;
    const { selectedLayers } = this.context;
    if (selectedLayers.length === 0) {
      this.initMultiSelectedLayer();
    }
  }

  componentDidUpdate(): void {
    contextCaller = this.context;
    const { selectedLayers } = this.context;
    if (selectedLayers.length === 0) {
      this.initMultiSelectedLayer();
    }
  }

  componentWillUnmount(): void {
    contextCaller = null;
  }

  addNewLayer = (): void => {
    const { setSelectedLayers } = this.context;
    let i = 1;
    let uniqName = `${LANG.layers.layer} ${i}`;
    while (svgCanvas.getCurrentDrawing().hasLayer(uniqName)) {
      i += 1;
      uniqName = `${LANG.layers.layer} ${i}`;
    }
    svgCanvas.createLayer(uniqName);
    if (TutorialController.getNextStepRequirement() === TutorialConstants.ADD_NEW_LAYER) {
      TutorialController.handleNextStep();
    }
    svgEditor.updateContextPanel();
    initLayerConfig(uniqName);
    setSelectedLayers([uniqName]);
  };

  cloneSelectedLayers = (): void => {
    const { selectedLayers, setSelectedLayers } = this.context;
    const newSelectedLayers = cloneSelectedLayers(selectedLayers);
    setSelectedLayers(newSelectedLayers);
  };

  deleteSelectLayers = (): void => {
    const { selectedLayers, setSelectedLayers } = this.context;
    deleteLayers(selectedLayers);
    setSelectedLayers([]);
  };

  lockSelectedLayers = (): void => {
    const { selectedLayers } = this.context;
    svgCanvas.clearSelection();
    setLayersLock(selectedLayers, true);
    this.forceUpdate();
  };

  unLockLayers = (layerName: string): void => {
    const { selectedLayers, setSelectedLayers } = this.context;
    if (selectedLayers.includes(layerName)) {
      setLayersLock(selectedLayers, false);
      this.forceUpdate();
    } else {
      setLayersLock([layerName], false);
      setSelectedLayers([layerName]);
    }
  };

  mergeLayer = (): void => {
    const drawing = svgCanvas.getCurrentDrawing();
    const layerCount = drawing.getNumLayers();
    const curIndex = drawing.getCurrentLayerPosition();
    if (curIndex === layerCount) {
      return;
    }
    svgCanvas.mergeLayer();
    const { setSelectedLayers } = this.context;
    setSelectedLayers([]);
  };

  mergeAllLayer = (): void => {
    svgCanvas.mergeAllLayers();
    const { setSelectedLayers } = this.context;
    setSelectedLayers([]);
  };

  mergeSelected = (): void => {
    const drawing = svgCanvas.getCurrentDrawing();
    const currentLayerName = drawing.getCurrentLayerName();
    const { selectedLayers, setSelectedLayers } = this.context;
    const baseLayer = mergeSelectedLayers(selectedLayers, currentLayerName);
    setSelectedLayers([baseLayer]);
  };

  renameLayer = (): void => {
    const { setSelectedLayers } = this.context;
    const drawing = svgCanvas.getCurrentDrawing();
    const oldName = drawing.getCurrentLayerName();

    Dialog.promptDialog({
      caption: LANG.notification.newName,
      defaultValue: oldName,
      onYes: (newName: string) => {
        if (!newName || oldName === newName) {
          return;
        }
        if (svgCanvas.getCurrentDrawing().hasLayer(newName)) {
          Alert.popUp({
            id: 'dupli_layer_name',
            message: LANG.notification.enterUniqueLayerName,
          });
          return;
        }
        svgCanvas.renameCurrentLayer(newName);
        cloneLayerConfig(oldName, newName);
        setSelectedLayers([newName]);
      },
    });
  };

  moveToOtherLayer = (e: DragEvent): void => {
    const select = e.target as HTMLSelectElement;
    const destLayer = select.options[select.selectedIndex].value;
    const drawing = svgCanvas.getCurrentDrawing();
    const confirmStr = LANG.notification.QmoveElemsToLayer.replace('%s', destLayer);

    const moveToLayer = (ok) => {
      if (!ok) {
        return;
      }
      this.promptMoveLayerOnce = true;
      svgCanvas.moveSelectedToLayer(destLayer);
      drawing.setCurrentLayer(destLayer);
      this.forceUpdate();
    };
    if (destLayer) {
      if (this.promptMoveLayerOnce) {
        moveToLayer(true);
      } else {
        Alert.popUp({
          id: 'move layer',
          buttonType: AlertConstants.YES_NO,
          message: confirmStr,
          onYes: moveToLayer,
        });
      }
    }
  };

  initMultiSelectedLayer = (): void => {
    if (!svgCanvas) {
      return;
    }
    const drawing = svgCanvas.getCurrentDrawing();
    const currentLayerName = drawing.getCurrentLayerName();
    if (currentLayerName) {
      const { setSelectedLayers } = this.context;
      setSelectedLayers([currentLayerName]);
    }
  };

  selectOnlyLayer = (layerName: string): void => {
    const { setSelectedLayers } = this.context;
    svgCanvas.clearSelection();
    const drawing = svgCanvas.getCurrentDrawing();
    const res = drawing.setCurrentLayer(layerName);
    if (res) {
      setSelectedLayers([layerName]);
    }
  };

  toggleLayerSelected = (layerName: string): void => {
    const { selectedLayers, setSelectedLayers } = this.context;
    const drawing = svgCanvas.getCurrentDrawing();
    const index = selectedLayers.findIndex((name: string) => name === layerName);
    if (index >= 0) {
      if (selectedLayers.length > 1) {
        selectedLayers.splice(index, 1);
        drawing.setCurrentLayer(selectedLayers[0]);
      }
    } else {
      selectedLayers.push(layerName);
      drawing.setCurrentLayer(layerName);
    }
    setSelectedLayers(selectedLayers);
  };

  toggleContiguousSelectedUntil = (layerName: string): void => {
    const drawing = svgCanvas.getCurrentDrawing();
    const currentLayer: string = drawing.getCurrentLayerName();

    const allLayers: string[] = drawing.all_layers.map((layer) => layer.name_);
    let [startIndex, endIndex] = [-1, -1];
    for (let i = 0; i < allLayers.length; i += 1) {
      if (allLayers[i] === currentLayer) {
        startIndex = i;
      }
      if (allLayers[i] === layerName) {
        endIndex = i;
      }
      if (startIndex > -1 && endIndex > -1) break;
    }
    if (startIndex < 0 || endIndex < 0) return;

    const { selectedLayers, setSelectedLayers } = this.context;
    const isLayerSelected = selectedLayers.includes(layerName);

    for (let i = startIndex; i !== endIndex; endIndex > startIndex ? i += 1 : i -= 1) {
      const index = selectedLayers.findIndex((name) => name === allLayers[i]);
      if (isLayerSelected && index >= 0) {
        selectedLayers.splice(index, 1);
      } else if (!isLayerSelected && index < 0) {
        selectedLayers.push(allLayers[i]);
      }
    }
    if (!selectedLayers.includes(layerName)) {
      selectedLayers.push(layerName);
    }
    drawing.setCurrentLayer(layerName);
    setSelectedLayers(selectedLayers);
  };

  highlightLayer = (layerName?: string): void => {
    let i: number;
    const curNames = [];
    const numLayers = svgCanvas.getCurrentDrawing().getNumLayers();
    for (i = 0; i < numLayers; i += 1) {
      curNames[i] = svgCanvas.getCurrentDrawing().getLayerName(i);
    }

    if (layerName) {
      for (i = 0; i < numLayers; i += 1) {
        if (curNames[i] !== layerName) {
          svgCanvas.getCurrentDrawing().setLayerOpacity(curNames[i], 0.5);
        }
      }
    } else {
      for (i = 0; i < numLayers; i += 1) {
        svgCanvas.getCurrentDrawing().setLayerOpacity(curNames[i], 1.0);
      }
    }
  };

  setLayerColor = (layerName: string, newColor: string): void => {
    const { selectedLayers } = this.context;
    const { isUsingLayerColor } = svgCanvas;
    if (selectedLayers.includes(layerName)) {
      for (let i = 0; i < selectedLayers.length; i += 1) {
        const layer = getLayerElementByName(selectedLayers[i]);
        layer.setAttribute('data-color', newColor);
        if (isUsingLayerColor) {
          svgCanvas.updateLayerColor(layer);
        }
      }
    } else {
      const layer = getLayerElementByName(layerName);
      layer.setAttribute('data-color', newColor);
      if (isUsingLayerColor) {
        svgCanvas.updateLayerColor(layer);
      }
    }
    this.forceUpdate();
  };

  setLayerVisibility = (layerName: string): void => {
    const drawing = svgCanvas.getCurrentDrawing();
    const isVis = drawing.getLayerVisibility(layerName);
    const { selectedLayers } = this.context;
    if (selectedLayers.includes(layerName)) {
      for (let i = 0; i < selectedLayers.length; i += 1) {
        svgCanvas.setLayerVisibility(selectedLayers[i], !isVis);
      }
    } else {
      svgCanvas.setLayerVisibility(layerName, !isVis);
    }
    this.forceUpdate();
  };

  openLayerColorPanel = (e: MouseEvent, layerName: string): void => {
    e.stopPropagation();
    this.setState({
      colorPanelLayer: layerName,
      colorPanelLeft: e.clientX,
      colorPanelTop: e.clientY,
    });
  };

  onlayerDragStart = (e: DragEvent, layerName: string): void => {
    const dragImage = document.getElementById('drag-image') as Element;
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    const { selectedLayers, setSelectedLayers } = this.context;
    if (!selectedLayers.includes(layerName)) {
      setSelectedLayers([layerName]);
    }

    this.setState({
      draggingLayer: layerName,
    });
  };

  onlayerCenterDragEnter = (layerName: string): void => {
    const { selectedLayers } = this.context;
    if (selectedLayers.includes(layerName)) {
      this.setState({ draggingDestIndex: null });
    }
  };

  onSensorAreaDragEnter = (index: number): void => {
    const { draggingDestIndex } = this.state;
    if (index !== draggingDestIndex) {
      this.setState({ draggingDestIndex: index });
    }
  };

  onlayerDragEnd = (): void => {
    const { draggingDestIndex } = this.state;
    const { selectedLayers } = this.context;
    if (draggingDestIndex !== null) {
      moveLayersToPosition(selectedLayers, draggingDestIndex);
      svgCanvas.sortTempGroupByLayer();
    }
    this.setState({
      draggingLayer: null,
      draggingDestIndex: null,
    });
  };

  layerDoubleClick = (): void => {
    this.renameLayer();
  };

  handleLayerClick = (e: MouseEvent, layerName: string): void => {
    const isCtrlOrCmd = (process.platform === 'darwin' && e.metaKey) || (process.platform !== 'darwin' && e.ctrlKey);
    if (e.button === 0) {
      if (isCtrlOrCmd) {
        this.toggleLayerSelected(layerName);
      } else if (e.shiftKey) {
        this.toggleContiguousSelectedUntil(layerName);
      } else {
        this.selectOnlyLayer(layerName);
      }
    } else if (e.button === 2) {
      const { selectedLayers } = this.context;
      if (!selectedLayers.includes(layerName)) {
        this.selectOnlyLayer(layerName);
      }
    }
  };

  renderColorPickerPanel(): Element {
    const { colorPanelLayer, colorPanelTop, colorPanelLeft } = this.state;
    if (!colorPanelLayer) {
      return null;
    }
    return (
      <ColorPickerPanel
        layerName={colorPanelLayer}
        top={colorPanelTop}
        left={colorPanelLeft}
        onClose={() => this.setState({ colorPanelLayer: null })}
        onColorChanged={(newColor: string) => this.setLayerColor(colorPanelLayer, newColor)}
      />
    );
  }

  renderDragImage = (): Element => {
    const drawing = svgCanvas.getCurrentDrawing();
    const { selectedLayers } = this.context;
    const { draggingLayer } = this.state;
    const layer = drawing.getLayerByName(draggingLayer);
    if (!draggingLayer || !layer) {
      return (<div id="drag-image" />);
    }
    const isLocked = layer.getAttribute('data-lock') === 'true';
    const isVis = drawing.getLayerVisibility(draggingLayer);
    const backLayers = [];
    for (let i = selectedLayers.length - 1; i >= 1; i -= 1) {
      backLayers.push(
        <div className="layer-back" key={i} style={{ top: -10 * i, left: 10 * i }} />,
      );
    }

    return (
      <div id="drag-image">
        {backLayers}
        <div className={classNames('layer', 'layersel', { lock: isLocked })}>
          <div className="drag-sensor-area" />
          <div className="layer-row">
            <div className="layercolor">
              <div style={{ backgroundColor: drawing.getLayerColor(draggingLayer) }} />
            </div>
            <div className="layername">{draggingLayer}</div>
            <div className={classNames('layervis', { layerinvis: !drawing.getLayerVisibility(draggingLayer) })}>
              <img className="vis-icon" src={isVis ? 'img/right-panel/icon-eyeopen.svg' : 'img/right-panel/icon-eyeclose.svg'} alt="vis-icon" />
            </div>
            <div className="layerlock">
              <img src="img/right-panel/icon-layerlock.svg" alt="lock-icon" />
            </div>
          </div>
          <div className="drag-sensor-area" />
        </div>
      </div>
    );
  };

  renderDragBar = (): Element => <div key="drag-bar" className={classNames('drag-bar')} />;

  renderLayerList = (): Element => {
    const { selectedLayers } = this.context;
    const { draggingDestIndex } = this.state;
    const items = [];
    const drawing = svgCanvas.getCurrentDrawing();
    const currentLayerName = drawing.getCurrentLayerName();

    const isAnyLayerMissing = drawing.all_layers.some((layer) => {
      if (!layer.group_.parentNode) {
        return true;
      }
      return false;
    });
    if (isAnyLayerMissing) {
      drawing.identifyLayers();
    }

    const allLayerNames: string[] = drawing.all_layers.map((layer) => layer.name_);

    if (draggingDestIndex === allLayerNames.length) {
      items.push(this.renderDragBar());
    }

    for (let i = allLayerNames.length - 1; i >= 0; i -= 1) {
      const layerName = allLayerNames[i];
      const layer = drawing.getLayerByName(layerName);
      if (layer) {
        const isLocked = layer.getAttribute('data-lock') === 'true';
        const isSelected = selectedLayers.includes(layerName);
        const isVis = drawing.getLayerVisibility(layerName);
        items.push(
          <div
            key={layerName}
            className={classNames('layer', { layersel: isSelected, lock: isLocked, current: currentLayerName === layerName })}
            onClick={(e: MouseEvent) => this.handleLayerClick(e, layerName)}
            onMouseOver={() => this.highlightLayer(layerName)}
            onMouseOut={() => this.highlightLayer()}
            draggable
            onDragStart={(e: DragEvent) => this.onlayerDragStart(e, layerName)}
            onDragEnd={() => this.onlayerDragEnd()}
          >
            <div
              className="drag-sensor-area"
              onDragEnter={() => this.onSensorAreaDragEnter(i + 1)}
            />
            <div
              className="layer-row"
              onDragEnter={() => this.onlayerCenterDragEnter(layerName)}
            >
              <div className="layercolor">
                <div
                  style={{ backgroundColor: drawing.getLayerColor(layerName) }}
                  onClick={(e: MouseEvent) => this.openLayerColorPanel(e, layerName)}
                />
              </div>
              <div
                className="layername"
                onDoubleClick={(e: MouseEvent) => {
                  if (!e.ctrlKey && !e.shiftKey && !e.metaKey) this.layerDoubleClick();
                }}
              >
                {layerName}
              </div>
              <div
                className={classNames('layervis')}
                onClick={(e: MouseEvent) => {
                  e.stopPropagation();
                  this.setLayerVisibility(layerName);
                }}
              >
                <img className="vis-icon" src={isVis ? 'img/right-panel/icon-eyeopen.svg' : 'img/right-panel/icon-eyeclose.svg'} alt="vis-icon" />
              </div>
              <div
                className="layerlock"
                onClick={(e: MouseEvent) => {
                  if (isLocked) {
                    e.stopPropagation();
                    this.unLockLayers(layerName);
                  }
                }}
              >
                <img src="img/right-panel/icon-layerlock.svg" alt="lock-icon" />
              </div>
            </div>
            <div
              className="drag-sensor-area"
              onDragEnter={() => this.onSensorAreaDragEnter(i)}
            />
          </div>,
        );
        if (draggingDestIndex === i) {
          items.push(this.renderDragBar());
        }
      }
    }

    return (
      <div id="layerlist">
        {items}
      </div>
    );
  };

  renderSelLayerBlock = (): Element => {
    const { elem } = this.props;
    const options = [];
    const drawing = svgCanvas.getCurrentDrawing();
    const layerCount = drawing.getNumLayers();
    if (!elem || layerCount === 1) {
      return null;
    }
    const currentLayerName = drawing.getCurrentLayerName();
    for (let i = layerCount - 1; i >= 0; i -= 1) {
      const layerName = drawing.getLayerName(i);
      options.push(
        <option value={layerName} key={i}>{layerName}</option>,
      );
    }

    return (
      <div className="selLayerBlock controls">
        <span id="selLayerLabel">{LANG.move_elems_to}</span>
        <select
          value={currentLayerName}
          id="selLayerNames"
          title="Move selected elements to a different layer"
          onChange={(e) => this.moveToOtherLayer(e)}
          disabled={options.length < 2}
        >
          {options}
        </select>
      </div>
    );
  };

  renderAddLayerButton(): Element {
    return (
      <div className="add-layer-btn" onClick={() => this.addNewLayer()}>
        <div className="bar bar1" />
        <div className="bar bar2" />
        <div className="bar bar3" />
      </div>
    );
  }

  render(): Element {
    if (!svgCanvas) {
      setTimeout(() => {
        this.forceUpdate();
      }, 50);
      return null;
    }
    const { selectedLayers } = this.context;
    const isMultiSelecting = selectedLayers.length > 1;
    const drawing = svgCanvas.getCurrentDrawing();
    const isSelectingLast = ((selectedLayers.length === 1)
      && (drawing.getLayerName(0) === selectedLayers[0]));
    return (
      <div id="layer-and-laser-panel">
        <div id="layerpanel" onMouseOut={() => this.highlightLayer()}>

          <ContextMenuTrigger id="layer-contextmenu" holdToDisplay={-1}>
            <div id="layerlist_container">
              {this.renderColorPickerPanel()}
              {this.renderLayerList()}
            </div>
          </ContextMenuTrigger>
          {this.renderAddLayerButton()}
          {this.renderSelLayerBlock()}
          {this.renderDragImage()}
          <ContextMenu id="layer-contextmenu">
            <MenuItem disabled={isMultiSelecting} onClick={this.renameLayer}>
              {LANG.layers.rename}
            </MenuItem>
            <MenuItem onClick={this.cloneSelectedLayers}>{LANG.layers.dupe}</MenuItem>
            <MenuItem onClick={this.lockSelectedLayers}>{LANG.layers.lock}</MenuItem>
            <MenuItem onClick={this.deleteSelectLayers}>{LANG.layers.del}</MenuItem>
            <MenuItem disabled={isMultiSelecting || isSelectingLast} onClick={this.mergeLayer}>
              {LANG.layers.merge_down}
            </MenuItem>
            <MenuItem disabled={isMultiSelecting} onClick={this.mergeAllLayer}>
              {LANG.layers.merge_all}
            </MenuItem>
            <MenuItem disabled={!isMultiSelecting} onClick={this.mergeSelected}>
              {LANG.layers.merge_selected}
            </MenuItem>
          </ContextMenu>
        </div>
        <LaserPanel
          selectedLayers={selectedLayers}
        />
      </div>
    );
  }
}

LayerPanel.propTypes = {
  elem: PropTypes.shape({ tagName: PropTypes.string }),
};

LayerPanel.defaultProps = {
  elem: {},
};

LayerPanel.contextType = LayerPanelContext;
