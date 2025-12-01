import type { IDialogBoxStyle } from '@core/interfaces/IDialog';

export interface IHintCircle {
  bottom?: number;
  height: number;
  left?: number;
  right?: number;
  top?: number;
  width: number;
}

export interface ITutorialDialog {
  callback?: string;
  dialogBoxStyles?: IDialogBoxStyle;
  hintCircle?: IHintCircle;
  holePosition?: {
    bottom?: number;
    left?: number;
    right?: number;
    top?: number;
  };
  holeSize?: {
    height?: number;
    width?: number;
  };
  id?: string;
  nextStepRequirement?: string;
  refElementId?: string;
  subElement?: React.JSX.Element;
  text: string;
}

export interface ITutorial {
  dialogStylesAndContents: ITutorialDialog[];
  end_alert?: string;
  hasNextButton?: boolean;
  id: string;
}

export interface IMediaTutorial {
  description: string;
  isVideo?: boolean;
  mediaSources: Array<{
    src: string;
    type: string;
  }>;
}
