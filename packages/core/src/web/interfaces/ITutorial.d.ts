import { IDialogBoxStyle } from 'interfaces/IDialog';

export interface IHintCircle {
  top?: number,
  bottom?: number,
  left?: number,
  right?: number,
  width: number,
  height: number,
}

export interface ITutorialDialog {
  id?: string;
  dialogBoxStyles: IDialogBoxStyle,
  holePosition?: {
    top?: number,
    bottom?: number,
    left?: number,
    right?: number,
  },
  holeSize?: {
    width?: number,
    height?: number,
  },
  hintCircle?: IHintCircle,
  text: string,
  subElement?: JSX.Element,
  nextStepRequirement?: string,
  callback?: string,
}

export interface ITutorial {
  id: string,
  end_alert?: string,
  hasNextButton?: boolean,
  dialogStylesAndContents: ITutorialDialog[],
}

export interface IMediaTutorial {
  mediaSources: {
    src: string;
    type: string;
  }[];
  description: string,
  isVideo?: boolean,
}
