import AbstractMenu from 'helpers/menubar/AbstractMenu';
import BeamboxPreference from 'app/actions/beambox/beambox-preference';

import { updateCheckbox } from '../electron-menubar-helper';

class Menu extends AbstractMenu {
  init(): void {
    const shouldShowRulers = !!BeamboxPreference.read('show_rulers');
    updateCheckbox(['_view', 'SHOW_RULERS'], shouldShowRulers);
    const isUsingLayerColor = BeamboxPreference.read('use_layer_color');
    updateCheckbox(['_view', 'SHOW_LAYER_COLOR'], isUsingLayerColor);
    const isUsingAntiAliasing = BeamboxPreference.read('anti-aliasing') !== false;
    updateCheckbox(['_view', 'ANTI_ALIASING'], isUsingAntiAliasing);

    this.initMenuEvents();
  }
}

export default new Menu();
