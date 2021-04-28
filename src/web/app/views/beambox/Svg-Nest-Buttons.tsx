import Alert from '../../actions/alert-caller';
import Constant from '../../actions/beambox/constant';
import Modal from '../../widgets/Modal';
import * as i18n from 'helpers/i18n';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import BeamboxPreference from 'app/actions/beambox/beambox-preference';

let svgCanvas, svgedit;
getSVGAsync((globalSVG) => { svgCanvas = globalSVG.Canvas; svgedit = globalSVG.Edit });

const React = requireNode('react');
const LANG = i18n.lang.beambox.tool_panels;

class SvgNestButtons extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isWorking: false
        }
    }

    nestElements = (elements, containerElem?: HTMLElement, config?: any) => {
        let containerPoints;
        const ClipperLib = window['ClipperLib'];
        if (containerElem) {
            const containerDpath = svgedit.utilities.getPathDFromElement(containerElem);
            const bbox = svgedit.utilities.getBBox(containerElem);
            let rotation = {
                angle: svgedit.utilities.getRotationAngle(containerElem),
                cx: bbox.x + bbox.width / 2,
                cy: bbox.y + bbox.height / 2
            };
            containerPoints = ClipperLib.dPathtoPointPathsAndScale(containerDpath, rotation, 1);
        } else {
            const w = Constant.dimension.getWidth(BeamboxPreference.read('model'));
            const h = Constant.dimension.getHeight(BeamboxPreference.read('model'));
            containerPoints = [{x: 0, y: 0}, {x: w, y: 0}, {x: w, y: h}, {x: 0, y: h}];
        }

        const elemPoints = [];
        this.undoNestChanges = [];
        this.nestedElements = [...elements];
        for (let i = 0; i < elements.length; i++) {
            let elem = elements[i];
            if (!elem) continue;

            let bbox;
            const id = elem.getAttribute('id');

            switch(elem.tagName) {
                case 'use':
                    bbox = svgCanvas.getSvgRealLocation(elem);
                    break;
                case 'filter':
                    continue;
                default:
                    bbox = svgCanvas.calculateTransformedBBox(elem);
                    break;
            }

            const rotation = {
                angle: svgedit.utilities.getRotationAngle(elem),
                cx: bbox.x + bbox.width / 2,
                cy: bbox.y + bbox.height / 2
            };

            let points;
            const d = svgedit.utilities.getPathDFromElement(elem);
            if (d) {
                const pointPaths = ClipperLib.dPathtoPointPathsAndScale(d, rotation, 1);
                points = pointPaths[0];
                for (let j = 1; j < pointPaths.length; j++) {
                    if(!points.children) {
                        points.children = [];
                    }
                    points.children.push(pointPaths[j])
                }
            } else {
                points = [{x: bbox.x, y: bbox.y}, {x: bbox.x + bbox.width, y: bbox.y}, {x: bbox.x + bbox.width, y: bbox.y + bbox.height}, {x: bbox.x, y: bbox.y + bbox.height}];
                if (rotation.angle) {
                    const rad = rotation.angle * Math.PI / 180;
                    points = points.map((p) => {
                        let x = p.x - rotation.cx;
                        let y = p.y - rotation.cy;
                        const new_x = x * Math.cos(rad) - y * Math.sin(rad) + rotation.cx;
                        const new_y = y * Math.cos(rad) + x * Math.sin(rad) + rotation.cy;
                        return {x: new_x, y: new_y};
                    });
                }
            }

            points.source = id;
            points.id = elemPoints.length;

            // SvgNest does not support 2 points line segment, here is a hacking to allow the arrangement
            if (points.length === 2) {
                points.push(points[1]);
            }

            elemPoints.push(points);

            let elementsToUndo = [elem];
            while (elementsToUndo.length > 0) {
                elem = elementsToUndo.pop();
                if (elem.nodeType !== 1) continue;
                let undoRecord: {
                    element: any,
                    attrs: any
                } = {
                    element: elem,
                    attrs: {
                        transform: elem.getAttribute('transform')
                    }
                }
                switch (elem.tagName) {
                    case 'path':
                        undoRecord.attrs.d = elem.getAttribute('d');
                    case 'polygon':
                        undoRecord.attrs.points = elem.getAttribute('points');
                    case 'ellipse':
                        undoRecord.attrs.cx = elem.getAttribute('cx');
                        undoRecord.attrs.cy = elem.getAttribute('cy');
                    default:
                        undoRecord.attrs.x = elem.getAttribute('x');
                        undoRecord.attrs.y = elem.getAttribute('y');
                        break;
                }
                elementsToUndo.push(...elem.childNodes);
                this.undoNestChanges.push(undoRecord);
            }
        }
        const SvgNest = window['SvgNest'];

        if (config) {
            SvgNest.config(config);
        }
        SvgNest.nestElements(containerPoints, elemPoints);
    }

    stopNestElement = () => {
        const SvgNest = window['SvgNest'];
        SvgNest.stop();
        let batchCmd = new svgedit.history.BatchCommand('Svg Nest');
        for(let i = 0; i < this.undoNestChanges.length; i++) {
            let elem = this.undoNestChanges[i].element;
            const subCmd = new svgedit.history.ChangeElementCommand(elem, this.undoNestChanges[i].attrs);
            batchCmd.addSubCommand(subCmd);
        }
        if (!batchCmd.isEmpty()) {
            svgCanvas.undoMgr.addCommandToHistory(batchCmd);
        }
        svgCanvas.selectOnly(this.nestedElements);
        if (this.nestedElements.length > 1) {
            svgCanvas.tempGroupSelectedElements();
        }
        this.nestedElements = null;
    }

    _close = () => {
        if (this.state.isWorking) {
            this.stopNestElement();
        }
        this.props.onClose();
    }

    onStartOrStop = () => {
        const {isWorking} = this.state;
        if (!isWorking) {
            if (svgCanvas.getTempGroup()) {
                let children = svgCanvas.ungroupTempGroup();
                svgCanvas.selectOnly(children, false);
            }
            let elems = svgCanvas.getSelectedElems().filter((e) => e);
            svgCanvas.clearSelection();
            if (elems.length === 0) {
                //Empty use all elements
                const drawing = svgCanvas.getCurrentDrawing();
                const layerNumber = drawing.getNumLayers();
                for (let i = 0; i < layerNumber; i++) {
                    const name = drawing.getLayerName(i);
                    const layer = drawing.getLayerByName(name);
                    if (layer.getAttribute('display') === 'none' || layer.getAttribute('data-lock') === 'true') {
                        continue;
                    }
                    const childNodes = layer.childNodes;
                    const children = $(layer).children();
                    for (let j = 0; j < childNodes.length; j++) {
                        if (!['title', 'filter'].includes(children[j].nodeName)) {
                            elems.push(children[j])
                        }
                    }
                }
            }
            console.log(elems);
            if (elems.length === 0) {
                Alert.popUp({
                    caption: LANG.nest,
                    message: LANG._nest.no_element
                });
                return;
            }
            this.nestElements(elems);
        } else {
            this.stopNestElement();
        }
        this.setState({
            isWorking: !isWorking
        });
    }

    renderStartButton = () => {
        const imgSrc = this.state.isWorking ? 'img/beambox/spin.svg' : 'img/beambox/start.svg';
        const label = this.state.isWorking ? LANG._nest.stop_nest : LANG._nest.start_nest;
        return (
            <div className='svg-nest-button active' onClick={() => {this.onStartOrStop()}}>
                <img src={imgSrc} draggable="false"/>
                <div className='text with-img'>{label}</div>
            </div>
        );
    }

    render() {
        const { isWorking } = this.state;
        if (isWorking) {
            return (
                <Modal className={{'no-background': true}}>
                    <div className={`svg-nest-buttons`}>
                        {this.renderStartButton()}
                        <div className='svg-nest-button' onClick={() => this._close()}>
                            <div className={'text'}>{LANG._nest.end}</div>
                        </div>
                    </div>
                </Modal>
            );
        }
        return (
            <div className={`svg-nest-buttons`}>
                {this.renderStartButton()}
                <div className='svg-nest-button' onClick={() => this._close()}>
                    <div className={'text'}>{LANG._nest.end}</div>
                </div>
            </div>
        );
    }
};

export default SvgNestButtons;
