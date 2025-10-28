import * as React from 'react';

import { Modal as AntdModal } from 'antd';

import Alert from '@core/app/actions/alert-caller';
import AlertConstants from '@core/app/constants/alert-constants';
import { TutorialContext, TutorialContextProvider } from '@core/app/views/tutorials/TutorialContext';
import DialogBox from '@core/app/widgets/Dialog-Box';
import Modal from '@core/app/widgets/Modal';
import ModalWithHole from '@core/app/widgets/Modal-With-Hole';
import i18n from '@core/helpers/i18n';
import type { ITutorialDialog } from '@core/interfaces/ITutorial';

// TODO: move all styles from web to modules.scss
import styles from './Tutorial.module.scss';

class TutorialComponent extends React.Component<{
  endTutorial: () => void;
}> {
  declare context: React.ContextType<typeof TutorialContext>;
  renderTutorialDialog() {
    const lang = i18n.lang.tutorial;
    const { endTutorial } = this.props;
    const { currentStep, dialogStylesAndContents, handleNextStep, hasNextButton } = this.context;
    const { dialogBoxStyles, subElement, text } = dialogStylesAndContents[currentStep];

    if (!dialogBoxStyles) {
      return (
        <AntdModal
          cancelButtonProps={{ hidden: true }}
          centered
          className={styles.modal}
          mask={false}
          okText={lang.next}
          onCancel={endTutorial}
          onOk={handleNextStep}
          open
          title={`${text} (${currentStep + 1}/${dialogStylesAndContents.length})`}
          width="unset"
        >
          {subElement}
        </AntdModal>
      );
    }

    return (
      <DialogBox
        arrowColor={dialogBoxStyles.arrowColor}
        arrowDirection={dialogBoxStyles.arrowDirection}
        arrowHeight={dialogBoxStyles.arrowHeight}
        arrowPadding={dialogBoxStyles.arrowPadding}
        arrowWidth={dialogBoxStyles.arrowWidth}
        content={
          <div className="tutorial-dialog">
            {`${currentStep + 1}/${dialogStylesAndContents.length}\n`}
            {text}
            {subElement}
            {hasNextButton ? (
              <div className="next-button" onClick={handleNextStep}>
                {lang.next}
              </div>
            ) : null}
          </div>
        }
        onClose={endTutorial}
        position={dialogBoxStyles.position}
      />
    );
  }

  renderHintCircle() {
    const { currentStep, dialogStylesAndContents } = this.context;
    const { hintCircle } = dialogStylesAndContents[currentStep];

    if (!hintCircle) {
      return null;
    }

    return <div className="hint-circle" style={hintCircle} />;
  }

  render() {
    const { currentStep, dialogStylesAndContents } = this.context;
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
      <ModalWithHole className={styles.tutorial} holePosition={holePosition} holeSize={holeSize}>
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
  dialogStylesAndContents: ITutorialDialog[];
  end_alert: string;
  hasNextButton: boolean;
  onClose: () => void;
}

export default function Tutorial({
  dialogStylesAndContents,
  end_alert,
  hasNextButton,
  onClose,
}: Props): React.JSX.Element {
  const endTutorial = () => {
    Alert.popUp({
      buttonType: AlertConstants.YES_NO,
      id: 'end-tutorial',
      message: end_alert,
      onYes: onClose,
    });
  };

  return (
    <TutorialContextProvider
      dialogStylesAndContents={dialogStylesAndContents}
      hasNextButton={hasNextButton}
      onClose={onClose}
    >
      <TutorialComponent endTutorial={endTutorial} />
    </TutorialContextProvider>
  );
}
