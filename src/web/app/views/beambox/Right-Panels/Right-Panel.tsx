import { RightPanelContext, RightPanelContextProvider } from './contexts/RightPanelContext'
import { ObjectPanelContextProvider } from './contexts/ObjectPanelContext'
import { LayerPanelContextProvider } from './contexts/LayerPanelContext'
import { ObjectPanel } from './Object-Panel'
import PathEditPanel from './Path-Edit-Panel';
import { LayerPanel } from './Layer-Panel';
import * as TutorialController from '../../tutorials/Tutorial-Controller';
import TutorialConstants from '../../../constants/tutorial-constants';
import * as i18n from '../../../../helpers/i18n';
import { getSVGAsync } from '../../../../helpers/svg-editor-helper';
let svgCanvas;
let svgEditor;
getSVGAsync((globalSVG) => { svgCanvas = globalSVG.Canvas; svgEditor = globalSVG.Editor; });
let _contextCaller;

const React = requireNode('react');
const classNames = requireNode('classnames');
const LANG = i18n.lang.beambox.right_panel;

const isWin = process.platform === 'win32';
const isLinux = process.platform === 'linux';

export class RightPanel extends React.Component {
    constructor() {
        super();
        this.state = {
            selectedTab: 'layers',
        };
    }

    componentDidMount() {
        _contextCaller = this.context;
    }

    componentDidUpdate() {
        const { mode, selectedElement } = this.context;
        const { selectedTab } = this.state;
        if (mode === 'element') {
            if (!selectedElement && selectedTab !== 'layers') {
                this.setState({selectedTab: 'layers'});
            } else if (selectedElement && !this.lastElement) {
                this.setState({selectedTab: 'objects'});
            } 
        } else {
            if (this.lastMode !== mode) {
                this.setState({selectedTab: 'objects'});
            }
        }
        this.lastMode = mode;
        this.lastElement = selectedElement;
    }

    renderTabs() {
        const {
            mode,
            selectedElement
        } = this.context;
        const { selectedTab } = this.state;
        const isObjectDisabled = (mode === 'element' && (!selectedElement || selectedElement.length < 1));
        let objectTitle = LANG.tabs.objects;
        const LangTopBar = i18n.lang.topbar;
        if (mode === 'path-edit') {
            objectTitle = LANG.tabs.path_edit;
        } else if (mode === 'element' &&  selectedElement) {
            if (selectedElement.getAttribute('data-tempgroup') === 'true') {
                objectTitle = LangTopBar.tag_names.multi_select;
            } else {
                if (selectedElement.tagName !== 'use') {
                    objectTitle = LangTopBar.tag_names[selectedElement.tagName];
                } else {
                    if (selectedElement.getAttribute('data-svg') === 'true') {
                        objectTitle = LangTopBar.tag_names.svg;
                    } else if (selectedElement.getAttribute('data-dxf') === 'true') {
                        objectTitle = LangTopBar.tag_names.dxf;
                    } else {
                        objectTitle = LangTopBar.tag_names.use;
                    }
                }
            }
        }
        return (
            <div className="right-panel-tabs">
                <div
                    className={classNames('tab', 'layers', {selected: selectedTab === 'layers'})}
                    onClick={() => {
                        this.setState({selectedTab: 'layers'});
                        if (TutorialController.getNextStepRequirement() === TutorialConstants.TO_LAYER_PANEL) {
                            svgCanvas.clearSelection();
                            TutorialController.handleNextStep();
                        }
                    }}
                >
                    <img className="tab-icon" src="img/right-panel/icon-layers.svg" draggable={false}/>
                    <div className="tab-title">
                        {LANG.tabs.layers}
                    </div>
                </div>
                <div
                    className={classNames('tab', 'objects', {disabled: isObjectDisabled, selected: selectedTab === 'objects'})}
                    onClick={() => {if (!isObjectDisabled) this.setState({selectedTab: 'objects'})}}>
                    <img className="tab-icon object" src="img/right-panel/icon-adjust.svg" draggable={false}/>
                    <div className="tab-title">
                        {objectTitle}   
                    </div>
                </div>
            </div>
        );
    }

    renderLayerAndLaserPanel() {
        const { selectedElement } = this.context;
        return (
            <LayerPanelContextProvider>
                <LayerPanel
                    elem={selectedElement}
                />
            </LayerPanelContextProvider>
        );
    }

    renderObjectPanel() {
        const { selectedElement } = this.context;
        return (
            <ObjectPanel
                elem={selectedElement}
            />
        );
    }

    renderPathEditPanel() {
        return (
            <PathEditPanel />
        );
    }

    render() {
        const { mode, selectedElement } = this.context;
        const { selectedTab } = this.state;
        let content;
        if (selectedTab === 'layers') {
            content = this.renderLayerAndLaserPanel();
        } else {
            if ( mode === 'path-edit') {
                content = this.renderPathEditPanel();
            } else { // element mode
                if (!selectedElement || selectedElement.length < 1) {
                    content = this.renderLayerAndLaserPanel();
                } else {
                    content = this.renderObjectPanel();
                }
            }
        }
        return (
            <div id="right-panel">
                <div id="sidepanels" className={classNames({win: isWin, linux: isLinux})}>
                    {this.renderTabs()}
                    <ObjectPanelContextProvider>
                        {content}
                    </ObjectPanelContextProvider>
                </div>
            </div>
        );
    }
}

RightPanel.contextType = RightPanelContext;

export class RightPanelContextHelper {
    static get context(): RightPanelContextProvider {
        return _contextCaller;
    }
};
