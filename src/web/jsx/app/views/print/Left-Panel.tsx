function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jquery', 'reactPropTypes', 'plugins/classnames/index', 'jsx!widgets/Dialog-Menu', 'app/constants/global-constants', 'app/actions/alert-actions'], function ($, PropTypes, ClassNames, DialogMenu, GlobalConstants, AlertActions) {
  const React = require('react');

  const DEFAULT_QUALITY = 'high',
        DEFAULT_MODEL = 'fd1';
  let lang;
  const constants = {
    MODEL: 'MODEL',
    QUALITY: 'QUALITY',
    RAFT_ON: 'RAFT_ON',
    SUPPORT_ON: 'SUPPORT_ON',
    ADVANCED: 'ADVANCED',
    PREVIEW: 'PREVIEW'
  };

  class LeftPanel extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "_handleActions", (source, arg, e) => {
        if (this.props.previewModeOnly === true) {
          e.preventDefault();

          if (source === 'PREVIEW') {
            $('#preview').parents('label').find('input').prop('checked', true);
            AlertActions.showPopupYesNo(GlobalConstants.EXIT_PREVIEW, lang.confirmExitFcodeMode);
          }

          return;
        }

        var self = this,
            actions = {
          'MODEL': function () {
            self.props.onQualityModelSelected(self.state.quality, arg);
          },
          'QUALITY': function () {
            self.props.onQualityModelSelected(arg, self.state.model);
          },
          'RAFT_ON': function () {
            self.props.onRaftClick();
          },
          'SUPPORT_ON': function () {
            self.props.onSupportClick();
          },
          'ADVANCED': function () {
            self.props.onShowAdvancedSettingPanel();
          },
          'PREVIEW': function () {
            if (e.target.type === 'range' || !self.props.hasObject || self.props.disablePreview) {
              e.preventDefault();
              return;
            }

            if (self.props.hasObject) {
              self.setState({
                previewOn: !self.state.previewOn
              }, function () {
                self.props.onPreviewClick(self.state.previewOn);
              });
            }
          }
        };

        if (source !== constants.PREVIEW) {
          this.setState({
            previewOn: false
          }, () => {
            this.props.onPreviewClick(false);
          });
        }

        actions[source]();
      });

      _defineProperty(this, "_handlePreviewLayerChange", e => {
        this.setState({
          previewCurrentLayer: e.target.value
        });
        this.props.onPreviewLayerChange(e.target.value);
      });

      _defineProperty(this, "_renderQuality", () => {
        const {
          previewModeOnly
        } = this.props;
        const _quality = ['high', 'med', 'low'];

        const _class = ClassNames('display-text quality-select', {
          'disable': previewModeOnly
        });

        const qualitySelection = _quality.map(quality => {
          return /*#__PURE__*/React.createElement("li", {
            key: quality,
            onClick: e => this._handleActions(constants.QUALITY, quality, e)
          }, lang.quality[quality]);
        });

        return {
          label: /*#__PURE__*/React.createElement("div", {
            className: _class
          }, /*#__PURE__*/React.createElement("span", null, lang.quality[this.state.quality])),
          content: /*#__PURE__*/React.createElement("ul", null, qualitySelection),
          disable: previewModeOnly
        };
      });

      _defineProperty(this, "_renderModel", () => {
        const {
          previewModeOnly
        } = this.props;

        const _class = ClassNames('display-text model-select', {
          'disable': previewModeOnly
        });

        const modelSelection = ['fd1', 'fd1p'].map(model => {
          return /*#__PURE__*/React.createElement("li", {
            key: model,
            onClick: e => this._handleActions(constants.MODEL, model, e)
          }, lang.model[model]);
        });
        return {
          label: /*#__PURE__*/React.createElement("div", {
            className: _class
          }, /*#__PURE__*/React.createElement("span", null, lang.model[this.state.model])),
          content: /*#__PURE__*/React.createElement("ul", null, modelSelection),
          disable: previewModeOnly
        };
      });

      _defineProperty(this, "_renderRaft", () => {
        const {
          enable,
          previewModeOnly,
          raftOn
        } = this.props;

        const _class = ClassNames('raft', {
          'disable': !enable
        });

        return {
          label: /*#__PURE__*/React.createElement("div", {
            className: _class,
            title: lang.raftTitle,
            onClick: e => this._handleActions(constants.RAFT_ON, '', e)
          }, /*#__PURE__*/React.createElement("div", null, raftOn ? lang.raft_on : lang.raft_off)),
          disable: previewModeOnly
        };
      });

      _defineProperty(this, "_renderSupport", () => {
        const {
          enable,
          previewModeOnly,
          supportOn
        } = this.props;

        const _class = ClassNames('support', {
          'disable': !enable
        });

        return {
          label: /*#__PURE__*/React.createElement("div", {
            className: _class,
            title: lang.supportTitle,
            onClick: e => this._handleActions(constants.SUPPORT_ON, '', e)
          }, /*#__PURE__*/React.createElement("div", null, supportOn ? lang.support_on : lang.support_off)),
          disable: previewModeOnly
        };
      });

      _defineProperty(this, "_renderAdvanced", () => {
        const {
          enable,
          lang,
          previewModeOnly
        } = this.props;

        const _class = ClassNames('advanced', {
          'disable': !enable || previewModeOnly
        });

        return {
          label: /*#__PURE__*/React.createElement("div", {
            className: _class,
            title: lang.advancedTitle,
            onClick: e => this._handleActions(constants.ADVANCED, '', e)
          }, /*#__PURE__*/React.createElement("div", null, lang.print.left_panel.advanced)),
          disable: previewModeOnly
        };
      });

      _defineProperty(this, "_renderPreview", () => {
        const {
          enable,
          previewModeOnly
        } = this.props;
        const {
          previewCurrentLayer,
          previewLayerCount,
          previewOn
        } = this.state;

        const _class = ClassNames('display-text preview', {
          'disable': !enable && !previewModeOnly
        });

        return {
          label: /*#__PURE__*/React.createElement("div", {
            id: "preview",
            className: _class,
            onClick: e => this._handleActions(constants.PREVIEW, '', e)
          }, /*#__PURE__*/React.createElement("span", null, lang.preview)),
          content: /*#__PURE__*/React.createElement("div", {
            className: "preview-panel"
          }, /*#__PURE__*/React.createElement("input", {
            ref: "preview",
            className: "range",
            type: "range",
            value: previewCurrentLayer,
            min: "0",
            max: previewLayerCount,
            onChange: this._handlePreviewLayerChange
          }), /*#__PURE__*/React.createElement("div", {
            className: "layer-count"
          }, previewCurrentLayer)),
          disable: !previewOn,
          previewOn: previewOn,
          forceKeepOpen: previewModeOnly
        };
      });

      this.state = {
        previewOn: false,
        previewCurrentLayer: 0,
        previewLayerCount: this.props.previewLayerCount,
        quality: DEFAULT_QUALITY,
        model: DEFAULT_MODEL
      };
    }

    UNSAFE_componentWillMount() {
      lang = this.props.lang.print.left_panel;
      lang.quality = this.props.lang.print.quality;
      lang.model = this.props.lang.print.model;
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
      this.setState({
        previewLayerCount: nextProps.previewLayerCount || 0
      });

      if (nextProps.previewLayerCount !== this.state.previewLayerCount) {
        this.setState({
          previewCurrentLayer: nextProps.previewLayerCount
        });
      }

      this.setState({
        quality: nextProps.quality
      });
      this.setState({
        model: nextProps.model
      });

      if (nextProps.previewMode !== this.state.previewOn) {
        this.setState({
          previewOn: nextProps.previewMode
        });
      }
    }

    render() {
      const {
        enable,
        previewModeOnly,
        displayModelControl
      } = this.props;
      const items = [this._renderQuality(), this._renderRaft(), this._renderSupport(), this._renderAdvanced(), this._renderPreview()];
      const mask = enable || previewModeOnly ? '' : /*#__PURE__*/React.createElement("div", {
        className: "mask"
      });

      if (displayModelControl) {
        items.unshift(this._renderModel());
      }

      return /*#__PURE__*/React.createElement("div", {
        className: "leftPanel"
      }, mask, /*#__PURE__*/React.createElement(DialogMenu, {
        ref: "dialogMenu",
        items: items
      }));
    }

  }

  ;
  LeftPanel.propTypes = {
    lang: PropTypes.object,
    enable: PropTypes.bool,
    previewMode: PropTypes.bool,
    previewModeOnly: PropTypes.bool,
    disablePreview: PropTypes.bool,
    displayModelControl: PropTypes.bool,
    hasObject: PropTypes.bool,
    previewLayerCount: PropTypes.number,
    supportOn: PropTypes.bool,
    raftOn: PropTypes.bool,
    onRaftClick: PropTypes.func,
    onSupportClick: PropTypes.func,
    onPreviewClick: PropTypes.func,
    onPreviewLayerChange: PropTypes.func,
    onShowAdvancedSettingPanel: PropTypes.func
  };
  return LeftPanel;
});