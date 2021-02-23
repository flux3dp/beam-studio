import DimensionPanel from './Dimension-Panel';
import OptionsPanel from './Options-Panel';
import ActionsPanel from './Actions-Panel';
import { ObjectPanelContext, ObjectPanelContextProvider } from './contexts/ObjectPanelContext';
import FnWrapper from '../../../actions/beambox/svgeditor-function-wrapper';
import * as i18n from '../../../../helpers/i18n';
import { getSVGAsync } from '../../../../helpers/svg-editor-helper';
let svgCanvas, svgedit;
getSVGAsync((globalSVG) => { svgCanvas = globalSVG.Canvas; svgedit = globalSVG.Edit });
const React = requireNode('react');
const classNames = requireNode('classnames');
const LANG = i18n.lang.beambox.right_panel.object_panel;
let _contextCaller;

export class ObjectPanel extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        };
    }

    componentDidMount() {
        _contextCaller = this.context;
    }

    componentWillUnmount() {
        _contextCaller = null;
    }

    getAvailableFunctions = () => {
        let { elem } = this.props;
        if (!elem) {
            return {};
        } 
        let elems = [elem]; 
        if (elems.length > 0 && elems[0].getAttribute('data-tempgroup') === 'true') {
            elems = Array.from(elems[0].childNodes);
        }

        const elementAllowBooleanOperations = (elem: Element) => {
            if (['rect', 'polygon', 'ellipse'].includes(elem.tagName)) {
                return true;
            }
            if (elem.tagName === 'path') {
                return svgCanvas.isElemFillable(elem);
            }
            return false;
        }

        return {
            'group': (elems && elems.length > 0),
            'ungroup': (elems && elems.length === 1 && ['g'].includes(elems[0].tagName)),
            'dist': (elems && elems.length > 2),
            'union': (elems && elems.length > 1 && elems.every(elem => elementAllowBooleanOperations(elem))),
            'subtract': (elems && elems.length === 2 && elems.every(elem => elementAllowBooleanOperations(elem))),
            'intersect': (elems && elems.length > 1 && elems.every(elem => elementAllowBooleanOperations(elem))),
            'difference': (elems && elems.length > 1 && elems.every(elem => elementAllowBooleanOperations(elem))),
        };
    }

    renderToolBtns = () => {
        const buttonAvailability = this.getAvailableFunctions();
        return (
            <div className="tool-btns-container">
                <div className="tool-btns-row">
                    <div className="half-row left sep">
                        {this.renderToolBtn(LANG.hdist, 'img/right-panel/icon-hdist.svg', !buttonAvailability['dist'], () => {svgCanvas.distHori()})}
                        {this.renderToolBtn(LANG.top_align, 'img/right-panel/icon-valign-top.svg', false, () => {FnWrapper.alignTop()})}
                        {this.renderToolBtn(LANG.middle_align, 'img/right-panel/icon-valign-mid.svg', false, () => {FnWrapper.alignMiddle()})}
                        {this.renderToolBtn(LANG.bottom_align, 'img/right-panel/icon-valign-bot.svg', false, () => {FnWrapper.alignBottom()})}
                    </div>
                    <div className="half-row right">
                        {this.renderToolBtn(LANG.vdist, 'img/right-panel/icon-vdist.svg', !buttonAvailability['dist'], () => {svgCanvas.distVert()})}
                        {this.renderToolBtn(LANG.left_align, 'img/right-panel/icon-halign-left.svg', false, () => {FnWrapper.alignLeft()})}
                        {this.renderToolBtn(LANG.center_align, 'img/right-panel/icon-halign-mid.svg', false, () => {FnWrapper.alignCenter()})}
                        {this.renderToolBtn(LANG.right_align, 'img/right-panel/icon-halign-right.svg', false, () => {FnWrapper.alignRight()})}
                    </div>
                </div>
                <div className="tool-btns-row">
                    <div className="half-row left">
                        {this.renderToolBtn(LANG.group, 'img/right-panel/icon-group.svg', false, () => {svgCanvas.groupSelectedElements()})}
                        {this.renderToolBtn(LANG.ungroup, 'img/right-panel/icon-ungroup.svg', !buttonAvailability['ungroup'], () => {svgCanvas.ungroupSelectedElement()})}
                    </div>
                    <div className="half-row right">
                        {this.renderToolBtn(LANG.union, 'img/right-panel/icon-union.svg', !buttonAvailability['union'], () => {svgCanvas.booleanOperationSelectedElements('union')})}
                        {this.renderToolBtn(LANG.subtract, 'img/right-panel/icon-subtract.svg', !buttonAvailability['subtract'], () => {svgCanvas.booleanOperationSelectedElements('diff')})}
                        {this.renderToolBtn(LANG.intersect, 'img/right-panel/icon-intersect.svg', !buttonAvailability['intersect'], () => {svgCanvas.booleanOperationSelectedElements('intersect')})}
                        {this.renderToolBtn(LANG.difference, 'img/right-panel/icon-diff.svg', !buttonAvailability['difference'], () => {svgCanvas.booleanOperationSelectedElements('xor')})}
                    </div>
                </div>
            </div>
        );
    }

    renderToolBtn = (label, src, disabled, onClick) => {
        const className = classNames('tool-btn', {disabled});
        if (!onClick || disabled) {
            onClick = () => {};
        }
        return (
            <div className={className} onClick={() => {onClick()}} title={label}>
                <img src={src} draggable={false}/>
            </div>
        );
    }

    renderDimensionPanel = () => {
        const { updateDimensionValues, getDimensionValues } = this.context;
        const { elem } = this.props;
        return (
            <DimensionPanel 
                elem={elem}
                updateDimensionValues={updateDimensionValues}
                getDimensionValues={getDimensionValues}
            />
        );
    }

    renderOptionPanel = () => {
        const { dimensionValues, updateDimensionValues, updateObjectPanel } = this.context;
        const { elem } = this.props;
        return (
            <OptionsPanel
                elem={elem}
                dimensionValues={dimensionValues}
                updateDimensionValues={updateDimensionValues}
                updateObjectPanel={updateObjectPanel}
            />
        );
    }

    renderActionPanel = () => {
        const { dimensionValues, updateDimensionValues } = this.context;
        const { elem } = this.props;
        return (
            <ActionsPanel
                elem={elem}
                dimensionValues={dimensionValues}
                updateDimensionValues={updateDimensionValues}
            />
        );
    }

    render() {
        return (
            <div id="object-panel">
                {this.renderToolBtns()}
                {this.renderDimensionPanel()}
                {this.renderOptionPanel()}
                {this.renderActionPanel()}
            </div>
        );
    }
}

ObjectPanel.contextType = ObjectPanelContext;

export class ObjectPanelContextHelper {
    static get context(): ObjectPanelContextProvider {
        return _contextCaller;
    }
};
