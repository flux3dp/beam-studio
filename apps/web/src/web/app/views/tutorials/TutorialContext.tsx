import React from 'react';

import eventEmitterFactory from 'helpers/eventEmitterFactory';
import RightPanelController from 'app/views/beambox/Right-Panels/contexts/RightPanelController';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { ITutorialDialog } from 'interfaces/ITutorial';
import { PanelType } from 'app/constants/right-panel-types';
import { TutorialCallbacks } from 'app/constants/tutorial-constants';

let svgCanvas;
getSVGAsync((globalSVG) => { svgCanvas = globalSVG.Canvas; });

export const TutorialContext = React.createContext({});

export const eventEmitter = eventEmitterFactory.createEventEmitter();

interface Props {
  hasNextButton: boolean,
  dialogStylesAndContents: ITutorialDialog[],
  onClose: () => void,
  children: React.ReactNode,
}

interface States {
  currentStep: number,
}

export class TutorialContextProvider extends React.Component<Props, States> {
  private defaultRect: Element;

  constructor(props) {
    super(props);
    this.state = {
      currentStep: 0,
    };

    eventEmitter.on('HANDLE_NEXT_STEP', this.handleNextStep.bind(this));
    eventEmitter.on('GET_NEXT_STEP_REQUIREMENT', this.getNextStepRequirement.bind(this));
  }

  componentWillUnmount() {
    eventEmitter.removeAllListeners();
    this.clearDefaultRect();
  }

  handleCallback = async (callbackId: TutorialCallbacks): Promise<void> => {
    if (callbackId === TutorialCallbacks.SELECT_DEFAULT_RECT) this.selectDefaultRect();
    else if (callbackId === TutorialCallbacks.SCROLL_TO_PARAMETER)
      await this.scrollToParameterSelect();
    else if (callbackId === TutorialCallbacks.SCROLL_TO_ADD_LAYER) this.scrollToAddLayerButton();
    else console.log('Unknown callback id', callbackId);
  };

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
        opacity: 1,
      },
    });
    this.defaultRect = defaultRect;
    svgCanvas.selectOnly([defaultRect], true);
    RightPanelController.setPanelType(PanelType.Object);
  };

  scrollToParameterSelect = async (): Promise<void> => {
    RightPanelController.setPanelType(PanelType.Layer);
    await new Promise<void>((resolve) => setTimeout(resolve, 100));
    document.querySelector('#layer-parameters')?.scrollIntoView();
  };

  scrollToAddLayerButton = (): void => {
    RightPanelController.setPanelType(PanelType.Layer);
    document.querySelector('#layer-and-laser-panel').scrollTop = 0;
  };

  clearDefaultRect = () => {
    if (this.defaultRect) {
      this.defaultRect.remove();
      svgCanvas.clearSelection();
      RightPanelController.setPanelType(PanelType.Layer);
    }
  };

  handleNextStep = async (): Promise<void> => {
    const { currentStep } = this.state;
    const { dialogStylesAndContents, onClose } = this.props;
    if (dialogStylesAndContents[currentStep].callback) {
      console.log(dialogStylesAndContents[currentStep].callback);
      await this.handleCallback(dialogStylesAndContents[currentStep].callback as TutorialCallbacks);
    }
    if (currentStep + 1 < dialogStylesAndContents.length) {
      this.setState({ currentStep: currentStep + 1 });
    } else {
      onClose();
    }
  };

  getNextStepRequirement = (response: {
    nextStepRequirement: string,
  }): void => {
    const { currentStep } = this.state;
    const { dialogStylesAndContents } = this.props;
    const { nextStepRequirement } = dialogStylesAndContents[currentStep];
    response.nextStepRequirement = nextStepRequirement;
  };

  render() {
    const {
      hasNextButton,
      dialogStylesAndContents,
      children,
    } = this.props;
    const {
      currentStep,
    } = this.state;
    const {
      handleNextStep,
    } = this;
    return (
      <TutorialContext.Provider value={{
        hasNextButton,
        dialogStylesAndContents,
        currentStep,
        handleNextStep,
      }}
      >
        {children}
      </TutorialContext.Provider>
    );
  }
}
