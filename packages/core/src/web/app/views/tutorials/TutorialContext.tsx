import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { PanelType } from '@core/app/constants/right-panel-types';
import tutorialConstants, { TutorialCallbacks } from '@core/app/constants/tutorial-constants';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import RightPanelController from '@core/app/views/beambox/Right-Panels/contexts/RightPanelController';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';
import type { ITutorialDialog } from '@core/interfaces/ITutorial';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

type TutorialContextType = {
  currentStep: number;
  dialogStylesAndContents: ITutorialDialog[];
  handleNextStep: () => Promise<void>;
  hasNextButton: boolean;
};

export const TutorialContext = React.createContext<TutorialContextType>({
  currentStep: 0,
  dialogStylesAndContents: [],
  handleNextStep: async () => {},
  hasNextButton: false,
});

export const eventEmitter = eventEmitterFactory.createEventEmitter();

interface Props {
  children: React.ReactNode;
  dialogStylesAndContents: ITutorialDialog[];
  hasNextButton: boolean;
  onClose: () => void;
}

export const TutorialContextProvider = ({
  children,
  dialogStylesAndContents,
  hasNextButton,
  onClose,
}: Props): JSX.Element => {
  const [currentStep, setCurrentStep] = useState(0);
  const defaultRectRef = useRef<Element | undefined>(undefined);
  const mouseMode = useCanvasStore((state) => state.mouseMode);

  const clearDefaultRect = useCallback(() => {
    if (defaultRectRef.current) {
      defaultRectRef.current.remove();
      svgCanvas.clearSelection();
      RightPanelController.setPanelType(PanelType.Layer);
      defaultRectRef.current = undefined;
    }
  }, []);

  const selectDefaultRect = useCallback(() => {
    if (defaultRectRef.current) {
      clearDefaultRect();
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

    defaultRectRef.current = defaultRect;
    svgCanvas.selectOnly([defaultRect], true);
    RightPanelController.setPanelType(PanelType.Object);
  }, [clearDefaultRect]);

  const scrollToParameterSelect = useCallback(async (): Promise<void> => {
    await new Promise<void>((resolve) => setTimeout(resolve, 100));
    RightPanelController.setPanelType(PanelType.Layer);
    await new Promise<void>((resolve) => setTimeout(resolve, 100));
    document.querySelector('#layer-parameters')?.scrollIntoView();
  }, []);

  const scrollToAddLayerButton = useCallback((): void => {
    RightPanelController.setPanelType(PanelType.Layer);

    const panel = document.querySelector('#layer-and-laser-panel');

    if (panel) panel.scrollTop = 0;
  }, []);

  const handleCallback = useCallback(
    async (callbackId: TutorialCallbacks): Promise<void> => {
      if (callbackId === TutorialCallbacks.SELECT_DEFAULT_RECT) {
        selectDefaultRect();
      } else if (callbackId === TutorialCallbacks.SCROLL_TO_PARAMETER) {
        await scrollToParameterSelect();
      } else if (callbackId === TutorialCallbacks.SCROLL_TO_ADD_LAYER) {
        scrollToAddLayerButton();
      } else {
        console.log('Unknown callback id', callbackId);
      }
    },
    [selectDefaultRect, scrollToParameterSelect, scrollToAddLayerButton],
  );

  const handleNextStep = useCallback(async (): Promise<void> => {
    if (dialogStylesAndContents[currentStep].callback) {
      console.log(dialogStylesAndContents[currentStep].callback);
      await handleCallback(dialogStylesAndContents[currentStep].callback as TutorialCallbacks);
    }

    if (currentStep + 1 < dialogStylesAndContents.length) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  }, [currentStep, dialogStylesAndContents, handleCallback, onClose]);

  const nextStepRequirement = useMemo(() => {
    return dialogStylesAndContents[currentStep]?.nextStepRequirement ?? '';
  }, [currentStep, dialogStylesAndContents]);

  const getNextStepRequirement = useCallback(
    (response: { nextStepRequirement: string | undefined }): void => {
      response.nextStepRequirement = nextStepRequirement;
    },
    [nextStepRequirement],
  );

  useEffect(() => {
    if (nextStepRequirement === tutorialConstants.SELECT_RECT && mouseMode === 'rect') {
      handleNextStep();
    } else if (nextStepRequirement === tutorialConstants.SELECT_CIRCLE && mouseMode === 'ellipse') {
      handleNextStep();
    }
  }, [mouseMode, nextStepRequirement, handleNextStep]);

  useEffect(() => {
    eventEmitter.on('HANDLE_NEXT_STEP', handleNextStep);
    eventEmitter.on('GET_NEXT_STEP_REQUIREMENT', getNextStepRequirement);

    return () => {
      eventEmitter.removeAllListeners();
      clearDefaultRect();
    };
  }, [handleNextStep, getNextStepRequirement, clearDefaultRect]);

  const contextValue = useMemo(
    () => ({
      currentStep,
      dialogStylesAndContents,
      handleNextStep,
      hasNextButton,
    }),
    [currentStep, dialogStylesAndContents, handleNextStep, hasNextButton],
  );

  return <TutorialContext.Provider value={contextValue}>{children}</TutorialContext.Provider>;
};
