import SegmentedControl from '../../../widgets/Segmented-Control';
import * as i18n from '../../../../helpers/i18n';
import { getSVGAsync } from '../../../../helpers/svg-editor-helper';
let svgCanvas, svgedit;
getSVGAsync((globalSVG) => { svgCanvas = globalSVG.Canvas; svgedit = globalSVG.Edit });

const React = requireNode('react');
const classNames = requireNode('classnames');
const LANG = i18n.lang.beambox.right_panel.object_panel.path_edit_panel;

const LINKTYPE_CORNER = 0;
const LINKTYPE_SMOOTH = 1; // same direction, different dist
const LINKTYPE_SYMMETRIC = 2; // same direction, same dist

class PathEditPanel extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        };
        console.log('TODO: more path actions (add node, break continous path...)');
    }

    onNodeTypeChange = (newType) => {
        svgedit.path.path.setSelectedNodeType(newType);
        this.setState(this.state);
    }

    renderNodeTypePanel() {
        const currentPath = svgedit.path.path;
        let isDisabled = (!currentPath || currentPath.selected_pts.length === 0);
        let selectedNodeTypes = [];
        if (currentPath) {
            const selectedNodes = currentPath.selected_pts.map((index) => currentPath.nodePoints[index]).filter((point) => point);
            selectedNodes.forEach((node) => {
                if (node) {
                    selectedNodeTypes.push(node.linkType);
                }
            });
            selectedNodeTypes = [...new Set(selectedNodeTypes)];
            selectedNodeTypes.sort();
            if (selectedNodeTypes.length > 1) {
                selectedNodeTypes = [];
            }
        }

        return (
            <div className='node-type-panel'>
                <div className="title">{LANG.node_type}</div>
                <SegmentedControl
                    isDisabled={isDisabled}
                    isExclusive={true} 
                    selectedIndexes={selectedNodeTypes}
                    onChanged={(newType) => this.onNodeTypeChange(newType)}
                    segments={[
                        {
                            imgSrc: 'img/right-panel/icon-nodetype-0.svg',
                            title: 'tCorner',
                            value: LINKTYPE_CORNER,
                        },
                        {
                            imgSrc: 'img/right-panel/icon-nodetype-1.svg',
                            title: 'tSmooth',
                            value: LINKTYPE_SMOOTH,
                        },
                        {
                            imgSrc: 'img/right-panel/icon-nodetype-2.svg',
                            title: 'tSymmetry',
                            value: LINKTYPE_SYMMETRIC,
                        },
                    ]}
                />
            </div>
        );
    }

    render() {
        const currentPath = svgedit.path.path;
        return (
            <div id="pathedit-panel">
                {this.renderNodeTypePanel()}
            </div>
        );
    }
}

export default PathEditPanel;
