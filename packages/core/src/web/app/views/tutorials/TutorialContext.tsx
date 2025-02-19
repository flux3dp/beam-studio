import React from 'react';

import { PanelType } from '@core/app/constants/right-panel-types';
import { TutorialCallbacks } from '@core/app/constants/tutorial-constants';
import RightPanelController from '@core/app/views/beambox/Right-Panels/contexts/RightPanelController';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { ITutorialDialog } from '@core/interfaces/ITutorial';

let svgCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

export const TutorialContext = React.createContext({});

export const eventEmitter = eventEmitterFactory.createEventEmitter();

interface Props {
  children: React.ReactNode;
  dialogStylesAndContents: ITutorialDialog[];
  hasNextButton: boolean;
  onClose: () => void;
}

interface States {
  currentStep: number;
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
    if (callbackId === TutorialCallbacks.SELECT_DEFAULT_RECT) {
      this.selectDefaultRect();
    } else if (callbackId === TutorialCallbacks.SCROLL_TO_PARAMETER) {
      await this.scrollToParameterSelect();
    } else if (callbackId === TutorialCallbacks.SCROLL_TO_ADD_LAYER) {
      this.scrollToAddLayerButton();
    } else {
      console.log('Unknown callback id', callbackId);
    }
  };

  selectDefaultRect = () => {
    if (this.defaultRect) {
      this.clearDefaultRect();
    }

    const defaultRect = svgCanvas.addSvgElementFromJson({
      attr: {
        'fill-opacity': 0,
        height: 100,
        id: svgCanvas.getNextId(),
        opacity: 1,
        stroke: '#000',
        width: 100,
        x: -1000,
        y: -1000,
      },
      curStyles: false,
      element: 'rect',
    });

    this.defaultRect = defaultRect;
    svgCanvas.selectOnly([defaultRect], true);
    RightPanelController.setPanelType(PanelType.Object);
  };

  scrollToParameterSelect = async (): Promise<void> => {
    await new Promise<void>((resolve) => setTimeout(resolve, 100));
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

  getNextStepRequirement = (response: { nextStepRequirement: string }): void => {
    const { currentStep } = this.state;
    const { dialogStylesAndContents } = this.props;
    const { nextStepRequirement } = dialogStylesAndContents[currentStep];

    response.nextStepRequirement = nextStepRequirement;
  };

  render() {
    const { children, dialogStylesAndContents, hasNextButton } = this.props;
    const { currentStep } = this.state;
    const { handleNextStep } = this;

    return (
      <TutorialContext.Provider
        value={{
          currentStep,
          dialogStylesAndContents,
          handleNextStep,
          hasNextButton,
        }}
      >
        {children}
      </TutorialContext.Provider>
    );
  }
}
