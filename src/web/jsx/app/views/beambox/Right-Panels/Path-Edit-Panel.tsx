function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jsx!views/beambox/Right-Panels/Dimension-Panel', 'jsx!widgets/Segmented-Control', 'jsx!contexts/DialogCaller', 'app/contexts/AlertCaller', 'app/constants/alert-constants', 'helpers/i18n'], function (DimensionPanel, SegmentedControl, DialogCaller, Alert, AlertConstants, i18n) {
  const React = require('react');

  const classNames = require('classnames');

  const LANG = i18n.lang.beambox.right_panel.object_panel.path_edit_panel;
  const LINKTYPE_CORNER = 0;
  const LINKTYPE_SMOOTH = 1; // same direction, different dist

  const LINKTYPE_SYMMETRIC = 2; // same direction, same dist

  class PathEditPanel extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "onNodeTypeChange", newType => {
        svgedit.path.path.setSelectedNodeType(newType);
        this.setState(this.state);
      });

      this.state = {};
      console.log('TODO: more path actions (add node, break continous path...)');
    }

    componentDidMount() {}

    componentWillUnmount() {}

    renderNodeTypePanel() {
      const currentPath = svgedit.path.path;
      let isDisabled = !currentPath || currentPath.selected_pts.length === 0;
      let selectedNodeTypes = [];

      if (currentPath) {
        const selectedNodes = currentPath.selected_pts.map(index => currentPath.nodePoints[index]).filter(point => point);
        selectedNodes.forEach(node => {
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

      return /*#__PURE__*/React.createElement("div", {
        className: "node-type-panel"
      }, /*#__PURE__*/React.createElement("div", {
        className: "title"
      }, LANG.node_type), /*#__PURE__*/React.createElement(SegmentedControl, {
        isDisabled: isDisabled,
        isExclusive: true,
        selectedIndexes: selectedNodeTypes,
        onChanged: newType => this.onNodeTypeChange(newType),
        segments: [{
          imgSrc: 'img/right-panel/icon-nodetype-0.svg',
          title: 'tCorner',
          value: LINKTYPE_CORNER
        }, {
          imgSrc: 'img/right-panel/icon-nodetype-1.svg',
          title: 'tSmooth',
          value: LINKTYPE_SMOOTH
        }, {
          imgSrc: 'img/right-panel/icon-nodetype-2.svg',
          title: 'tSymmetry',
          value: LINKTYPE_SYMMETRIC
        }]
      }));
    }

    render() {
      const currentPath = svgedit.path.path;
      return /*#__PURE__*/React.createElement("div", {
        id: "pathedit-panel"
      }, this.renderNodeTypePanel());
    }

  }

  return PathEditPanel;
});