import { getOS } from '@core/helpers/getOS';
import isWeb from '@core/helpers/is-web';

const osName = getOS();

export default {
  layerListHeight: 400, // px
  menubarHeight: osName === 'Windows' && !isWeb() ? 30 : 40, // px
  rightPanelScrollBarWidth: osName !== 'MacOS' ? 16 : 0, // px
  rightPanelWidth: osName !== 'MacOS' ? 258 : 242, // px
  rulerWidth: 15, // px
  sidePanelsWidth: osName !== 'MacOS' ? 308 : 292, // px
  titlebarHeight: osName === 'Windows' && !isWeb() ? 30 : 0, // px
  toolButtonHeight: 43, // px, 30 px button + 13 px margin
  topBarHeight: osName === 'Windows' && !isWeb() ? 70 : 40, // px
  topBarHeightWithoutTitleBar: 40, // px
};
