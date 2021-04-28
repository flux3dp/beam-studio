import Constant from 'app/actions/beambox/constant';

export enum TopRef {
  WINDOW = 0,
  TOPBAR = 1,
  LAYER_LIST = 2,
}

export enum RightRef {
  WINDOW = 0,
  RIGHT_SROLL_BAR = 1,
  RIGHT_PANEL = 2,
}

export const calculateTop = (top: number, ref: TopRef = TopRef.WINDOW): number => {
  switch (ref) {
    case TopRef.TOPBAR:
      return top + Constant.topBarHeight;
    case TopRef.LAYER_LIST:
      return top + Constant.topBarHeight + Constant.layerListHeight;
    default:
      return top + Constant.menuberHeight;
  }
};

export const calculateRight = (right: number, ref: RightRef = RightRef.WINDOW): number => {
  switch (ref) {
    case RightRef.RIGHT_SROLL_BAR:
      return right + Constant.rightPanelScrollBarWidth;
    case RightRef.RIGHT_PANEL:
      return right + Constant.rightPanelWidth;
    default:
      return right;
  }
};
