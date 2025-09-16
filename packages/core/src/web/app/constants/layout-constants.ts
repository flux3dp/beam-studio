import isWeb from '@core/helpers/is-web';

export default {
  layerListHeight: 400, // px
  menuberHeight: window.os === 'Windows' && !isWeb() ? 30 : 40, // px
  rightPanelScrollBarWidth: window.os !== 'MacOS' ? 16 : 0, // px
  rightPanelWidth: window.os !== 'MacOS' ? 258 : 242, // px
  rulerWidth: 15, // px
  sidePanelsWidth: window.os !== 'MacOS' ? 308 : 292, // px
  titlebarHeight: window.os === 'Windows' && !isWeb() ? 30 : 0, // px
  toolButtonHeight: 43, // px, 30 px button + 13 px margin
  topBarHeight: window.os === 'Windows' && !isWeb() ? 70 : 40, // px
  topBarHeightWithoutTitleBar: 40, // px
};
