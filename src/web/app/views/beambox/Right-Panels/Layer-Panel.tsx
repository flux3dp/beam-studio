import { LayerPanelContext } from './contexts/LayerPanelContext';
import { initLayerConfig, cloneLayerConfig } from '../../../../helpers/laser-config-helper';
import { sortLayerNamesByPosition, getLayerElementByName, deleteLayers, cloneSelectedLayers, setLayersLock, mergeSelectedLayers, moveLayersToPosition  } from '../../../../helpers/layer-helper';
import LaserPanel from './Laser-Panel';
import ColorPickerPanel from '../Color-Picker-Panel';
import DialogCaller from '../../../contexts/DialogCaller';
import Alert from '../../../contexts/AlertCaller';
import AlertConstants from '../../../constants/alert-constants';
import * as TutorialController from '../../../views/tutorials/Tutorial-Controller';
import TutorialConstants from '../../../constants/tutorial-constants';
import * as i18n from '../../../../helpers/i18n';
import { getSVGAsync } from '../../../../helpers/svg-editor-helper';
let svgCanvas, svgEdit;
getSVGAsync((globalSVG) => { svgCanvas = globalSVG.Canvas; svgEdit = globalSVG.Edit });

const React = requireNode('react');
const classNames = requireNode('classnames');
const { ContextMenu, MenuItem, ContextMenuTrigger } = requireNode('react-contextmenu');
const LANG = i18n.lang.beambox.right_panel.layer_panel;
let _contextCaller;

export class ContextHelper {
    static get context() {
        return _contextCaller;
    }
}

interface ILayerPanelContext {
    selectedLayers?: string[],
    setSelectedLayers: (layers: string[]) => null,
}

export class LayerPanel extends React.Component {
    private context: ILayerPanelContext;
    constructor() {
        super();
        this.state = {
            colorPanelLayer: null,
            colorPanelLeft: null,
            colorPanelTop: null,
        };
        console.log('TODO: visible/invisable icon');
    }

    componentDidMount() {
        _contextCaller = this.context;
        if (this.context.selectedLayers.length === 0) {
            this.initMultiSelectedLayer();
        }
    }

    componentDidUpdate() {
        _contextCaller = this.context;
        if (this.context.selectedLayers.length === 0) {
            this.initMultiSelectedLayer();
        }
    }

    componentWillUnmount() {
        _contextCaller = null;
    }

    addNewLayer = () => {
        const { setSelectedLayers } = this.context;
        let i = 0;
        let uniqName = LANG.layers.layer + ' ' + (++i);
        while (svgCanvas.getCurrentDrawing().hasLayer(uniqName)) {
            uniqName = LANG.layers.layer + ' ' + (++i);
        }
        svgCanvas.createLayer(uniqName);
        if (TutorialController.getNextStepRequirement() === TutorialConstants.ADD_NEW_LAYER) {
            TutorialController.handleNextStep();
        }
        window['updateContextPanel']();
        initLayerConfig(uniqName);
        setSelectedLayers([uniqName]);
    }

    cloneSelectedLayers = () => {
        const { selectedLayers } = this.context;
        const newSelectedLayers = cloneSelectedLayers(selectedLayers);
        this.context.setSelectedLayers(newSelectedLayers);
    }

    deleteSelectLayers = () => {
        const { selectedLayers } = this.context;
        deleteLayers(selectedLayers);
        this.context.setSelectedLayers([]);
    }

    lockSelectedLayers = () => {
        const { selectedLayers } = this.context;
        setLayersLock(selectedLayers, true);
        this.setState(this.state);
    }

    unLockLayers = (layerName: string) => {
        const { selectedLayers } = this.context;
        if (selectedLayers.includes(layerName)) {
            setLayersLock(selectedLayers, false);
            this.setState(this.state);
        } else {
            setLayersLock([layerName], false);
            this.context.setSelectedLayers([layerName]);
        }
    }

    mergeLayer = () => {
        const drawing = svgCanvas.getCurrentDrawing();
        const layerCount = drawing.getNumLayers();
        let curIndex = drawing.getCurrentLayerPosition();
        if (curIndex === layerCount) {
            return;
        }
        svgCanvas.mergeLayer();
        this.context.setSelectedLayers([]);
    }

    mergeAllLayer = () => {
        svgCanvas.mergeAllLayers();
        this.context.setSelectedLayers([]);
    }

    mergeSelected = () => {
        const drawing = svgCanvas.getCurrentDrawing();
        const currentLayerName = drawing.getCurrentLayerName();
        const { selectedLayers } = this.context;
        const baseLayer = mergeSelectedLayers(selectedLayers, currentLayerName);
        this.context.setSelectedLayers([baseLayer]);
    }

    renameLayer = () => {
        const { setSelectedLayers } = this.context;
        const drawing = svgCanvas.getCurrentDrawing();
        const oldName = drawing.getCurrentLayerName();

        DialogCaller.promptDialog({
            caption: LANG.notification.newName,
            defaultValue: '',
            onYes: (newName) => {
                if (!newName) {
                    return;
                }
                if (oldName === newName || svgCanvas.getCurrentDrawing().hasLayer(newName)) {
                    Alert.popUp({
                        id: 'old_layer_name',
                        message: LANG.notification.layerHasThatName,
                    });
                    return;
                }

                svgCanvas.renameCurrentLayer(newName);
                cloneLayerConfig(oldName, newName);
                setSelectedLayers([newName]);
            },
        });
    }

    moveLayerRel = (pos) => {
        const drawing = svgCanvas.getCurrentDrawing();
        const layerCount = drawing.getNumLayers();
        let curIndex = drawing.getCurrentLayerPosition();
        if (curIndex > 0 || curIndex < layerCount - 1) {
            curIndex += pos;
            svgCanvas.setCurrentLayerPosition(curIndex);
            this.setState(this.state);
        }
    }

    moveToOtherLayer = (e) => {
        const select = e.target;
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
            this.setState(this.state);
        };
        if (destLayer) {
            if (this.promptMoveLayerOnce) {
                moveToLayer(true);
            } else {
                Alert.popUp({
                    id: 'move layer',
                    buttonType: AlertConstants.YES_NO,
                    message: confirmStr,
                    onYes: moveToLayer
                });
            }
        }
    }

    initMultiSelectedLayer = () => {
        if (!svgCanvas) {
            return;
        }
        const drawing = svgCanvas.getCurrentDrawing();
        const currentLayerName = drawing.getCurrentLayerName();
        if (currentLayerName) {
            this.context.setSelectedLayers([currentLayerName]);
        }
    }

    selectOnlyLayer = (layerName: string) => {
        const { setSelectedLayers } = this.context;
        svgCanvas.clearSelection();
        const drawing = svgCanvas.getCurrentDrawing();
        const res = drawing.setCurrentLayer(layerName);
        if (res) {
            setSelectedLayers([layerName]);
        }
    }

    toggleLayerSelected = (layerName: string) => {
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
    }

    toggleContiguousSelectedUntil = (layerName: string) => {
        const drawing = svgCanvas.getCurrentDrawing();
        const currentLayer: string = drawing.getCurrentLayerName();

        const allLayers: string[] = drawing.all_layers.map((layer) => layer.name_);
        let [startIndex, endIndex] = [-1, -1];
        for (let i = 0; i < allLayers.length; i++) {
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

        for (let i = startIndex; i !== endIndex; endIndex > startIndex ? i++ : i--) {
            const index = selectedLayers.findIndex((layerName) => layerName === allLayers[i]);
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
    }

    highlightLayer = function (layerName?: string) {
        let i: number, curNames = [];
        const numLayers = svgCanvas.getCurrentDrawing().getNumLayers();
        for (i = 0; i < numLayers; i++) {
            curNames[i] = svgCanvas.getCurrentDrawing().getLayerName(i);
        }

        if (layerName) {
            for (i = 0; i < numLayers; ++i) {
                if (curNames[i] !== layerName) {
                    svgCanvas.getCurrentDrawing().setLayerOpacity(curNames[i], 0.5);
                }
            }
        } else {
            for (i = 0; i < numLayers; ++i) {
                svgCanvas.getCurrentDrawing().setLayerOpacity(curNames[i], 1.0);
            }
        }
    };

    setLayerColor = (layerName: string, newColor: string) => {
        const { selectedLayers } = this.context;
        const { isUsingLayerColor } = svgCanvas;
        if (selectedLayers.includes(layerName)) {
            for (let i = 0; i < selectedLayers.length; i++) {
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
        this.setState(this.state);
    }

    setLayerVisibility = (layerName: string) => {
        const drawing = svgCanvas.getCurrentDrawing();
        const isVis = drawing.getLayerVisibility(layerName);
        const { selectedLayers } = this.context;
        if (selectedLayers.includes(layerName)) {
            for (let i = 0; i < selectedLayers.length; i++) {
                svgCanvas.setLayerVisibility(selectedLayers[i], !isVis);
            }
        } else {
            svgCanvas.setLayerVisibility(layerName, !isVis);
        }
        this.setState(this.state);
    }

    openLayerColorPanel = (e: MouseEvent, layerName: string) => {
        e.stopPropagation();
        this.setState({
            colorPanelLayer: layerName,
            colorPanelLeft: e.clientX,
            colorPanelTop: e.clientY,
        });
    }

    onlayerDragStart = (e: DragEvent ,layerName: string) => {
        const dragImage = document.getElementById('drag-image') as Element;
        e.dataTransfer.setDragImage(dragImage, 0, 0);
        const { selectedLayers, setSelectedLayers } = this.context;
        if (!selectedLayers.includes(layerName)) {
            setSelectedLayers([layerName]);
        }

        this.setState({
            draggingLayer: layerName,
        });
    }

    onlayerCenterDragEnter = (layerName: string) => {
        const { selectedLayers } = this.context;
        if (selectedLayers.includes(layerName)) {
            this.setState({ draggingDestIndex: null });
        }
    }

    onSensorAreaDragEnter = (index: number) => {
        const { draggingDestIndex } = this.state;
        if (index !== draggingDestIndex) {
            this.setState({ draggingDestIndex: index });
        }
    }

    onlayerDragEnd = () => {
        const { draggingDestIndex } = this.state;
        const { selectedLayers } = this.context;
        if (draggingDestIndex !== null) {
            moveLayersToPosition(selectedLayers, draggingDestIndex);
        }
        this.setState({
            draggingLayer: null,
            draggingDestIndex: null,
        });
    }

    layerDoubleClick = (layerName) => {
        this.renameLayer();
    }

    handleLayerClick = (e: MouseEvent, layerName: string) => {
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
    }

    renderColorPickerPanel() {
        const { colorPanelLayer, colorPanelTop, colorPanelLeft } = this.state;
        if (!colorPanelLayer) {
            return null;
        }
        return (
            <ColorPickerPanel
                layerName={colorPanelLayer}
                top={colorPanelTop}
                left={colorPanelLeft}
                onClose={() => this.setState({colorPanelLayer: null})}
                onColorChanged={(newColor: string) => this.setLayerColor(colorPanelLayer, newColor)}
            />
        );
    }

    renderDragImage = () => {
        const drawing = svgCanvas.getCurrentDrawing();
        const { selectedLayers } = this.context;
        const { draggingLayer } = this.state;
        const layer = drawing.getLayerByName(draggingLayer);
        if (!draggingLayer || !layer) {
            return (<div id='drag-image' />);
        }
        const isLocked = layer.getAttribute('data-lock') === 'true';
        const backLayers = [];
        for (let i = selectedLayers.length - 1; i >= 1; i--) {
            backLayers.push(
                <div className='layer-back' key={i} style={{top: -10 * i, left: 10 * i}}/>
            );
        }

        return (
            <div id='drag-image'>
                {backLayers}
                <div className={classNames('layer', 'layersel', {'lock': isLocked})}>
                    <div className= 'drag-sensor-area' />
                    <div className='layer-row'>
                        <div className='layercolor'>
                            <div style={{backgroundColor: drawing.getLayerColor(draggingLayer)}} />
                        </div>
                        <div className='layername' >{draggingLayer}</div>
                        <div className={classNames('layervis', {'layerinvis': !drawing.getLayerVisibility(draggingLayer)})}>
                            <i className='fa fa-eye'></i>
                        </div>
                        <div className='layerlock'>
                            <img src='img/icon-lock.svg'/>
                        </div>
                    </div>
                    <div className= 'drag-sensor-area'/>
                </div>
            </div>
        );
    }

    renderDragBar = () => {
        return (
            <div key={'drag-bar'} className={classNames('drag-bar')}/>
        );
    }

    renderLayerList = () => {
        const { selectedLayers } = this.context;
        const { draggingDestIndex } = this.state;
        const items = [];
        const drawing = svgCanvas.getCurrentDrawing();
        const currentLayerName = drawing.getCurrentLayerName();
        const allLayerNames: string[] = drawing.all_layers.map((layer) => layer.name_);

        if (draggingDestIndex === allLayerNames.length) {
            items.push(this.renderDragBar());
        }

        for (let i = allLayerNames.length - 1; i >= 0; i--) {
            const layerName = allLayerNames[i];
            const layer = drawing.getLayerByName(layerName);
            if (!layer) {
                continue;
            }
            const isLocked = layer.getAttribute('data-lock') === 'true';
            const isSelected = selectedLayers.includes(layerName);
            const isVis = drawing.getLayerVisibility(layerName);
            items.push(
                <div
                    key={layerName}
                    className={classNames('layer', {'layersel': isSelected, 'lock': isLocked, 'current': currentLayerName === layerName})}
                    onClick={(e: MouseEvent) => this.handleLayerClick(e, layerName)}
                    onMouseOver={() => this.highlightLayer(layerName)}
                    onMouseOut={() => this.highlightLayer()}
                    draggable={true}
                    onDragStart={(e: DragEvent) => {this.onlayerDragStart(e, layerName)}}
                    onDragEnd={() => {this.onlayerDragEnd()}}
                >
                    <div className= 'drag-sensor-area'
                        onDragEnter={() => this.onSensorAreaDragEnter(i + 1)}
                    />
                    <div className='layer-row'
                        onDragEnter={() => {this.onlayerCenterDragEnter(layerName)}}
                    >
                        <div className='layercolor'>
                            <div style={{backgroundColor: drawing.getLayerColor(layerName)}}
                                onClick={(e: MouseEvent) => {this.openLayerColorPanel(e, layerName)}}
                            />
                        </div>
                        <div className='layername' onDoubleClick={() => this.layerDoubleClick(layerName)}>{layerName}</div>
                        <div
                            className={classNames('layervis')}
                            onClick={(e: MouseEvent) => {
                                e.stopPropagation();
                                this.setLayerVisibility(layerName);
                            }}
                        >
                            <img className='vis-icon' src={isVis ? 'img/right-panel/icon-eyeopen.svg' : 'img/right-panel/icon-eyeclose.svg'} />
                        </div>
                        <div className='layerlock' onClick={(e: MouseEvent) => {
                            if (isLocked) {
                                e.stopPropagation();
                                this.unLockLayers(layerName);
                            }
                        }}>
                            <img src='img/icon-lock.svg'/>
                        </div>
                    </div>
                    <div className= 'drag-sensor-area'
                        onDragEnter={() => this.onSensorAreaDragEnter(i)}
                    />
                </div>
            );
            if (draggingDestIndex === i) {
                items.push(this.renderDragBar());
            }
        }

        return (
            <div id="layerlist">
                {items}
            </div>
        );
    }

    renderSelLayerBlock = () => {
        const { elem } = this.props;
        const options = [];
        const drawing = svgCanvas.getCurrentDrawing();
        const layerCount = drawing.getNumLayers();
        if ( !elem || layerCount === 1) {
            return null;
        }
        const currentLayerName = drawing.getCurrentLayerName();
        for (let i = layerCount - 1; i >= 0; i--) {
            const layerName = drawing.getLayerName(i);
            options.push(
                <option value={layerName} key={i}>{layerName}</option>
            );
        }

        return (
            <div className='selLayerBlock controls'>
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
    }

    renderAddLayerButton() {
        return (
            <div className="add-layer-btn" onClick={() => {this.addNewLayer()}}>
                <div className= "bar bar1"/>
                <div className= "bar bar2"/>
                <div className= "bar bar3"/>
            </div>
        );
    }

    render() {
        if (!svgCanvas) {
            setTimeout(() => {
                this.setState(this.state);
            }, 50);
            return null;
        }
        const { selectedLayers } = this.context;
        const isMultiSelecting = selectedLayers.length > 1;
        const drawing = svgCanvas.getCurrentDrawing();
        const isSelectingLast = (selectedLayers.length === 1) && (drawing.getLayerName(0) === selectedLayers[0]);
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
                        <MenuItem disabled={isMultiSelecting} onClick={this.renameLayer}>{LANG.layers.rename}</MenuItem>
                        <MenuItem onClick={this.cloneSelectedLayers}>{LANG.layers.dupe}</MenuItem>
                        <MenuItem onClick={this.lockSelectedLayers}>{LANG.layers.lock}</MenuItem>
                        <MenuItem onClick={this.deleteSelectLayers}>{LANG.layers.del}</MenuItem>
                        <MenuItem disabled={isMultiSelecting || isSelectingLast} onClick={this.mergeLayer}>{LANG.layers.merge_down}</MenuItem>
                        <MenuItem disabled={isMultiSelecting} onClick={this.mergeAllLayer}>{LANG.layers.merge_all}</MenuItem>
                        <MenuItem disabled={!isMultiSelecting} onClick={this.mergeSelected}>{LANG.layers.merge_selected}</MenuItem>
                    </ContextMenu>
                </div>
                <LaserPanel
                    selectedLayers={this.context.selectedLayers}
                />
            </div>
        );
    }
}

LayerPanel.contextType = LayerPanelContext;
