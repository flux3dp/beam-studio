import isWeb from 'helpers/is-web';

export default {
  rightPanelWidth: window.os !== 'MacOS' ? 258 : 242, // px
  rightPanelScrollBarWidth: window.os !== 'MacOS' ? 16 : 0, // px
  sidePanelsWidth: window.os !== 'MacOS' ? 308 : 292, // px
  topBarHeight: window.os === 'Windows' && !isWeb() ? 70 : 40, // px
  topBarHeightWithoutTitleBar: 40, // px
  titlebarHeight: window.os === 'Windows' && !isWeb() ? 30 : 0, // px
  menuberHeight: window.os === 'Windows' && !isWeb() ? 30 : 40, // px
  layerListHeight: 400, // px
  rulerWidth: 15, // px
};
