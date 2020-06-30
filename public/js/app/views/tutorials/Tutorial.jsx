define([
    'jsx!widgets/Dialog-Box',
    'jsx!widgets/Modal',
    'jsx!widgets/Modal-With-Hole',
    'app/contexts/AlertCaller',
    'app/constants/alert-constants',
    'app/constants/tutorial-constants',
    'helpers/i18n'
], function (
    DialogBox,
    Modal,
    ModalWithHole,
    Alert,
    AlertConstants,
    TutorialConstants,
    i18n
) {
    const React = require('react');
    const classNames = require('classnames');
    const { createContext } = React;
    const TutorialContext = createContext();
    const LANG = i18n.lang.tutorial;

    const ret = {};

    class TutorialContextProvider extends React.Component {
        constructor(props) {
            super(props);
            this.state = {
                currentStep: 0,
            }
        }
        componentWillUnmount() {
            this.clearDefaultRect();
        }

        handleCallback = (callbackId) => {
            switch(callbackId) {
                case TutorialConstants.callbackConstants.SELECT_DEFAULT_RECT:
                    this.selectDefaultRect();
                    break;
                default:
                    break;
            }
        }

        selectDefaultRect = () => {
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
        }

        clearDefaultRect = () => {
            if (this.defaultRect) {
                this.defaultRect.remove();
                svgCanvas.clearSelection();
            }
        }

        handleNextStep = () => {
            const { currentStep } = this.state;
            const { dialogStylesAndContents, onClose } = this.props;
            if (dialogStylesAndContents[currentStep].callback) {
                console.log(dialogStylesAndContents[currentStep].callback);
                this.handleCallback(dialogStylesAndContents[currentStep].callback);
            }
            if (currentStep + 1 < dialogStylesAndContents.length) {
                this.setState({currentStep: this.state.currentStep + 1});
            } else {
                onClose();
            }
        }

        getNextStepRequirement = () => {
            const { currentStep } = this.state;
            const { dialogStylesAndContents } = this.props;
            const nextStepRequirement = dialogStylesAndContents[currentStep].nextStepRequirement;
            return nextStepRequirement;
        }

        render() {
            const {
                hasNextButton,
                dialogStylesAndContents,
            } = this.props;
            const {
                currentStep
            } = this.state;
            const {
                getNextStepRequirement,
                handleNextStep
            } = this;
            return(
                <TutorialContext.Provider value={{
                    hasNextButton,
                    dialogStylesAndContents,
                    currentStep,
                    getNextStepRequirement,
                    handleNextStep,
                }}>
                    {this.props.children}
                </TutorialContext.Provider>
            );
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
            const { currentStep, dialogStylesAndContents, hasNextButton, handleNextStep } = this.context;
            const { dialogBoxStyles, text } = dialogStylesAndContents[currentStep];
            return (
                <DialogBox
                    {...dialogBoxStyles}
                    onClose={() => this.props.endTutorial()}
                >
                    <div className="tutorial-dialog">
                        {`${currentStep + 1}/${dialogStylesAndContents.length}\n${text}`}
                        { hasNextButton ? 
                        <div className="next-button" onClick={() => handleNextStep()}>
                            {LANG.next}
                        </div> : null}
                    </div>
                </DialogBox>
            );
        }

        renderHintCircle() {
            const { currentStep, dialogStylesAndContents } = this.context;
            const { hintCircle } = dialogStylesAndContents[currentStep];
            if (!hintCircle) {
                return null;
            }
            return (
                <div className="hint-circle" style={hintCircle} />
            );
        }

        render() {
            const { currentStep, dialogStylesAndContents, onClose } = this.context;
            if (currentStep >= dialogStylesAndContents.length) {
                onClose();
                return null;
            }
            const { holePosition, holeSize } = dialogStylesAndContents[currentStep];
            if (!holePosition) {
                return (
                    <Modal className={{'no-background': true}}>
                        <div className="tutorial-container">
                            {this.renderTutorialDialog()}
                            {this.renderHintCircle()}
                        </div>
                    </Modal>
                );
            }
            return (
                <ModalWithHole
                    holePosition={holePosition}
                    holeSize={holeSize}
                >
                    <div className="tutorial-container">
                        {this.renderTutorialDialog()}
                        {this.renderHintCircle()}
                    </div>
                </ModalWithHole>
                
            );
        }
    };
    TutorialComponent.contextType = TutorialContext;

    class Tutorial extends React.Component {
        constructor(props) {
            super(props);
        }

        endTutorial = () => {
            const { onClose, end_alert } = this.props;
            Alert.popUp({
                id: 'end-tutorial',
                message: end_alert,
                buttonType: AlertConstants.YES_NO,
                onYes: () => {
                    onClose();
                }
            });
        }

        render() {
            return(
                <TutorialContextProvider {...this.props}>
                    <TutorialComponent endTutorial={this.endTutorial}/>
                </TutorialContextProvider>
            )
        }
    }
    ret.Tutorial = Tutorial;

    return ret;
});