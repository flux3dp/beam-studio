import type { ReactNode } from 'react';
import React, { useContext, useMemo } from 'react';

import { Modal as AntdModal } from 'antd';

import Alert from '@core/app/actions/alert-caller';
import AlertConstants from '@core/app/constants/alert-constants';
import { TutorialContext, TutorialContextProvider } from '@core/app/views/tutorials/TutorialContext';
import DialogBox from '@core/app/widgets/Dialog-Box';
import Modal from '@core/app/widgets/Modal';
import ModalWithHole from '@core/app/widgets/Modal-With-Hole';
import useI18n from '@core/helpers/useI18n';
import type { ITutorialDialog } from '@core/interfaces/ITutorial';

// TODO: move all styles from web to modules.scss
import styles from './Tutorial.module.scss';

interface ComponentProps {
  endTutorial: () => void;
}

const applyPosition = (obj: { bottom?: number; left?: number; right?: number; top?: number }, rect: DOMRect) => {
  const positionedObj: typeof obj = { ...obj };
  const keys = ['top', 'bottom', 'left', 'right'] as const;

  keys.forEach((key) => {
    if (positionedObj[key] !== undefined) positionedObj[key] += rect[key];
  });

  return positionedObj;
};

const TutorialComponent = ({ endTutorial }: ComponentProps): ReactNode => {
  const lang = useI18n().tutorial;
  const { currentStep, dialogStylesAndContents, handleNextStep, hasNextButton } = useContext(TutorialContext);
  const { dialogBoxStyles, hintCircle, holePosition, holeSize, refElementId, subElement, text } =
    dialogStylesAndContents[currentStep];
  const refElement = useMemo(() => (refElementId ? document.getElementById(refElementId) : null), [refElementId]);
  const dialogPosition = useMemo(() => {
    if (!dialogBoxStyles?.position) return undefined;

    const position = dialogBoxStyles.position;

    if (refElement) {
      const rect = refElement.getBoundingClientRect();

      return applyPosition(position, rect);
    }

    return position;
  }, [dialogBoxStyles?.position, refElement]);

  const actualHintCircle = useMemo(() => {
    if (!hintCircle) return undefined;

    if (!refElement) return hintCircle;

    const rect = refElement.getBoundingClientRect();

    return applyPosition(hintCircle, rect);
  }, [hintCircle, refElement]);

  const actualHolePosition = useMemo(() => {
    if (!holePosition) return undefined;

    if (!refElement) return holePosition;

    const rect = refElement.getBoundingClientRect();

    return applyPosition(holePosition, rect);
  }, [holePosition, refElement]);

  const renderTutorialDialog = (): ReactNode => {
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
        position={dialogPosition}
      />
    );
  };

  const renderHintCircle = () => {
    if (!hintCircle) return null;

    return <div className={styles.hint} style={actualHintCircle} />;
  };

  if (!actualHolePosition) {
    return (
      <Modal className={{ 'no-background': true, [styles.tutorial]: true }}>
        <div>
          {renderTutorialDialog()}
          {renderHintCircle()}
        </div>
      </Modal>
    );
  }

  return (
    <ModalWithHole className={styles.tutorial} holePosition={actualHolePosition} holeSize={holeSize}>
      <div>
        {renderTutorialDialog()}
        {renderHintCircle()}
      </div>
    </ModalWithHole>
  );
};

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
