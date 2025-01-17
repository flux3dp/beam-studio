import * as React from 'react';

import Alert from 'app/actions/alert-caller';
import AlertConstants from 'app/constants/alert-constants';
import DialogBox from 'app/widgets/Dialog-Box';
import i18n from 'helpers/i18n';
import Modal from 'app/widgets/Modal';
import ModalWithHole from 'app/widgets/Modal-With-Hole';
import { ITutorialDialog } from 'interfaces/ITutorial';
import { TutorialContext, TutorialContextProvider } from 'app/views/tutorials/TutorialContext';

// TODO: move all styles from web to modules.scss
import styles from './Tutorial.module.scss';

const LANG = i18n.lang.tutorial;

class TutorialComponent extends React.Component<{
  endTutorial: () => void,
}> {
  renderTutorialDialog() {
    const { endTutorial } = this.props;
    const {
      currentStep, dialogStylesAndContents, hasNextButton, handleNextStep,
    } = this.context;
    const { dialogBoxStyles, text, subElement } = dialogStylesAndContents[currentStep];
    return (
      <DialogBox
        arrowDirection={dialogBoxStyles.arrowDirection}
        arrowHeight={dialogBoxStyles.arrowHeight}
        arrowWidth={dialogBoxStyles.arrowWidth}
        arrowColor={dialogBoxStyles.arrowColor}
        arrowPadding={dialogBoxStyles.arrowPadding}
        position={dialogBoxStyles.position}
        onClose={endTutorial}
        content={(
          <div className="tutorial-dialog">
            {`${currentStep + 1}/${dialogStylesAndContents.length}\n`}
            {text}
            {subElement}
            {hasNextButton
              ? (
                <div className="next-button" onClick={handleNextStep}>
                  {LANG.next}
                </div>
              ) : null}
          </div>
        )}
      />
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
    const tutorialDialog = this.renderTutorialDialog();
    const hintCircle = this.renderHintCircle();
    if (!holePosition) {
      return (
        <Modal className={{ 'no-background': true, [styles.tutorial]: true }}>
          <div className="tutorial-container">
            {tutorialDialog}
            {hintCircle}
          </div>
        </Modal>
      );
    }
    return (
      <ModalWithHole
        className={styles.tutorial}
        holePosition={holePosition}
        holeSize={holeSize}
      >
        <div className="tutorial-container">
          {tutorialDialog}
          {hintCircle}
        </div>
      </ModalWithHole>
    );
  }
}

TutorialComponent.contextType = TutorialContext;

interface Props {
  end_alert: string;
  dialogStylesAndContents: ITutorialDialog[];
  hasNextButton: boolean;
  onClose: () => void;
}

export default function Tutorial({
  end_alert,
  dialogStylesAndContents,
  hasNextButton,
  onClose,
}: Props): JSX.Element {
  const endTutorial = () => {
    Alert.popUp({
      id: 'end-tutorial',
      message: end_alert,
      buttonType: AlertConstants.YES_NO,
      onYes: onClose,
    });
  };

  return (
    <TutorialContextProvider
      hasNextButton={hasNextButton}
      dialogStylesAndContents={dialogStylesAndContents}
      onClose={onClose}
    >
      <TutorialComponent endTutorial={endTutorial} />
    </TutorialContextProvider>
  );
}
