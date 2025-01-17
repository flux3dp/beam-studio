import beamboxPreference from 'app/actions/beambox/beambox-preference';
import isDev from 'helpers/is-dev';
import layoutConstants from 'app/constants/layout-constants';
import { modelsWithModules } from 'app/constants/layer-module/layer-modules';

export enum TopRef {
  WINDOW = 0,
  TOPBAR = 1,
  LAYER_LIST = 2,
  LAYER_PARAMS = 3,
}

export enum RightRef {
  WINDOW = 0,
  RIGHT_SROLL_BAR = 1,
  RIGHT_PANEL = 2,
  PATH_PREVIEW_BTN = 3,
}

export const calculateTop = (top: number, ref: TopRef = TopRef.WINDOW): number => {
  switch (ref) {
    case TopRef.TOPBAR:
      return top + layoutConstants.topBarHeight;
    case TopRef.LAYER_LIST:
      return top + layoutConstants.topBarHeight + layoutConstants.layerListHeight;
    case TopRef.LAYER_PARAMS: {
      const offset = document.querySelector('#layer-parameters')?.getBoundingClientRect().top || 0;
      return top + offset;
    }
    default:
      return top + layoutConstants.titlebarHeight;
  }
};

export const calculateRight = (right: number, ref: RightRef = RightRef.WINDOW): number => {
  switch (ref) {
    case RightRef.RIGHT_SROLL_BAR:
      return right + layoutConstants.rightPanelScrollBarWidth;
    case RightRef.RIGHT_PANEL:
      return right + layoutConstants.rightPanelWidth;
    case RightRef.PATH_PREVIEW_BTN: {
      const workarea = beamboxPreference.read('workarea');
      const shouldHideBtn = !isDev() && modelsWithModules.has(workarea);
      const offset = shouldHideBtn ? 6 : 48;
      return right + offset;
    }
    default:
      return right;
  }
};
