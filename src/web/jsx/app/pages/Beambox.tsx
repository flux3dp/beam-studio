define(['app/actions/beambox/beambox-init', 'app/actions/beambox/beambox-global-interaction', 'app/actions/beambox/beambox-preference', 'helpers/i18n', 'helpers/local-storage', 'jsx!views/beambox/Top-Bar/Top-Bar', 'jsx!views/beambox/Top-Bar/contexts/Top-Bar-Context', 'jsx!views/beambox/Zoom-Block/Zoom-Block', 'jsx!views/beambox/Zoom-Block/contexts/Zoom-Block-Context', 'jsx!pages/svg-editor', 'jsx!views/dialogs/AlertsAndProgress', 'jsx!views/dialogs/Dialog', 'jsx!/contexts/AlertProgressContext', 'jsx!/contexts/DialogContext', 'app/contexts/AlertCaller', 'app/constants/alert-constants', 'helpers/output-error'], function (BeamboxInit, BeamboxGlobalInteraction, BeamboxPreference, i18n, localStorage, {
  TopBar
}, {
  TopBarContextProvider
}, {
  ZoomBlock
}, {
  ZoomBlockContextProvider
}, SvgEditor, {
  AlertsAndProgress
}, {
  Dialog
}, {
  AlertProgressContextProvider
}, {
  DialogContextProvider
}, AlertCaller, AlertConstants, outputError) {
  const React = require('react');

  const LANG = i18n.lang.beambox;
  BeamboxInit.init();

  class view extends React.Component {
    constructor(props) {
      super(props);
    }

    componentDidMount() {
      BeamboxGlobalInteraction.attach(); // need to run after svgedit packages loaded, so place it at componentDidMouont

      if (BeamboxPreference.read('show_guides')) {
        BeamboxInit.displayGuides();
      }

      let ipc = electron.ipc;
      let events = electron.events;
      ipc.send(events.FRONTEND_READY);
      BeamboxInit.showTutorial();
      BeamboxInit.checkOSVersion();
    }

    componentWillUnmount() {
      BeamboxGlobalInteraction.detach();
    }

    render() {
      return /*#__PURE__*/React.createElement(AlertProgressContextProvider, null, /*#__PURE__*/React.createElement(DialogContextProvider, null, /*#__PURE__*/React.createElement("div", {
        className: "studio-container beambox-studio"
      }, /*#__PURE__*/React.createElement(TopBarContextProvider, null, /*#__PURE__*/React.createElement(TopBar, null)), /*#__PURE__*/React.createElement(ZoomBlockContextProvider, null, /*#__PURE__*/React.createElement(ZoomBlock, null)), /*#__PURE__*/React.createElement(SvgEditor, null), /*#__PURE__*/React.createElement("div", {
        id: "tool-panels-placeholder"
      }), /*#__PURE__*/React.createElement("div", {
        id: "image-trace-panel-placeholder"
      }), /*#__PURE__*/React.createElement(Dialog, {
        index: 0
      }), /*#__PURE__*/React.createElement(AlertsAndProgress, {
        index: 0
      }))));
    }

  }

  return () => view;
});