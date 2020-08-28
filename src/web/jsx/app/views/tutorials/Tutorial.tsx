function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jsx!widgets/Dialog-Box', 'jsx!widgets/Modal', 'jsx!widgets/Modal-With-Hole', 'app/contexts/AlertCaller', 'app/constants/alert-constants', 'jsx!constants/tutorial-constants', 'helpers/i18n'], function (DialogBox, Modal, ModalWithHole, Alert, AlertConstants, TutorialConstants, i18n) {
  const React = require('react');

  const classNames = require('classnames');

  const {
    createContext
  } = React;
  const TutorialContext = createContext();
  const LANG = i18n.lang.tutorial;
  const ret = {};

  class TutorialContextProvider extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "handleCallback", callbackId => {
        switch (callbackId) {
          case TutorialConstants.callbackConstants.SELECT_DEFAULT_RECT:
            this.selectDefaultRect();
            break;

          default:
            break;
        }
      });

      _defineProperty(this, "selectDefaultRect", () => {
        if (this.defaultRect) {
          this.clearDefaultRect();
        }

        const defaultRect = svgCanvas.addSvgElementFromJson({
          element: 'rect',
          curStyles: false,
          attr: {
            x: -1000,
            y: -1000,
            width: 100,
            height: 100,
            stroke: '#000',
            id: svgCanvas.getNextId(),
            'fill-opacity': 0,
            opacity: 1
          }
        });
        this.defaultRect = defaultRect;
        svgCanvas.selectOnly([defaultRect], true);
      });

      _defineProperty(this, "clearDefaultRect", () => {
        if (this.defaultRect) {
          this.defaultRect.remove();
          svgCanvas.clearSelection();
        }
      });

      _defineProperty(this, "handleNextStep", () => {
        const {
          currentStep
        } = this.state;
        const {
          dialogStylesAndContents,
          onClose
        } = this.props;

        if (dialogStylesAndContents[currentStep].callback) {
          console.log(dialogStylesAndContents[currentStep].callback);
          this.handleCallback(dialogStylesAndContents[currentStep].callback);
        }

        if (currentStep + 1 < dialogStylesAndContents.length) {
          this.setState({
            currentStep: this.state.currentStep + 1
          });
        } else {
          onClose();
        }
      });

      _defineProperty(this, "getNextStepRequirement", () => {
        const {
          currentStep
        } = this.state;
        const {
          dialogStylesAndContents
        } = this.props;
        const nextStepRequirement = dialogStylesAndContents[currentStep].nextStepRequirement;
        return nextStepRequirement;
      });

      this.state = {
        currentStep: 0
      };
    }

    componentWillUnmount() {
      this.clearDefaultRect();
    }

    render() {
      const {
        hasNextButton,
        dialogStylesAndContents
      } = this.props;
      const {
        currentStep
      } = this.state;
      const {
        getNextStepRequirement,
        handleNextStep
      } = this;
      return /*#__PURE__*/React.createElement(TutorialContext.Provider, {
        value: {
          hasNextButton,
          dialogStylesAndContents,
          currentStep,
          getNextStepRequirement,
          handleNextStep
        }
      }, this.props.children);
    }

  }

  class TutorialComponent extends React.Component {
    componentDidMount() {
      ret.contextCaller = this.context;
    }

    componentWillUnmount() {
      ret.contextCaller = null;
    }

    renderTutorialDialog() {
      const {
        currentStep,
        dialogStylesAndContents,
        hasNextButton,
        handleNextStep
      } = this.context;
      const {
        dialogBoxStyles,
        text,
        subElement
      } = dialogStylesAndContents[currentStep];
      return /*#__PURE__*/React.createElement(DialogBox, _extends({}, dialogBoxStyles, {
        onClose: () => this.props.endTutorial()
      }), /*#__PURE__*/React.createElement("div", {
        className: "tutorial-dialog"
      }, `${currentStep + 1}/${dialogStylesAndContents.length}\n`, text, subElement, hasNextButton ? /*#__PURE__*/React.createElement("div", {
        className: "next-button",
        onClick: () => handleNextStep()
      }, LANG.next) : null));
    }

    renderHintCircle() {
      const {
        currentStep,
        dialogStylesAndContents
      } = this.context;
      const {
        hintCircle
      } = dialogStylesAndContents[currentStep];

      if (!hintCircle) {
        return null;
      }

      return /*#__PURE__*/React.createElement("div", {
        className: "hint-circle",
        style: hintCircle
      });
    }

    render() {
      const {
        currentStep,
        dialogStylesAndContents,
        onClose
      } = this.context;

      if (currentStep >= dialogStylesAndContents.length) {
        onClose();
        return null;
      }

      const {
        holePosition,
        holeSize
      } = dialogStylesAndContents[currentStep];

      if (!holePosition) {
        return /*#__PURE__*/React.createElement(Modal, {
          className: {
            'no-background': true
          }
        }, /*#__PURE__*/React.createElement("div", {
          className: "tutorial-container"
        }, this.renderTutorialDialog(), this.renderHintCircle()));
      }

      return /*#__PURE__*/React.createElement(ModalWithHole, {
        holePosition: holePosition,
        holeSize: holeSize
      }, /*#__PURE__*/React.createElement("div", {
        className: "tutorial-container"
      }, this.renderTutorialDialog(), this.renderHintCircle()));
    }

  }

  ;
  TutorialComponent.contextType = TutorialContext;

  class Tutorial extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "endTutorial", () => {
        const {
          onClose,
          end_alert
        } = this.props;
        Alert.popUp({
          id: 'end-tutorial',
          message: end_alert,
          buttonType: AlertConstants.YES_NO,
          onYes: () => {
            onClose();
          }
        });
      });
    }

    render() {
      return /*#__PURE__*/React.createElement(TutorialContextProvider, this.props, /*#__PURE__*/React.createElement(TutorialComponent, {
        endTutorial: this.endTutorial
      }));
    }

  }

  ret.Tutorial = Tutorial;
  return ret;
});