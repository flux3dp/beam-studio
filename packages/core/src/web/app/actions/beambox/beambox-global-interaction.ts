import tabController from '@core/app/actions/tabController';
import { CanvasMode } from '@core/app/constants/canvasMode';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import { useSelectedElementStore } from '@core/app/stores/element/selectedElementStore';
import selectionManager from '@core/app/svgedit/selection';
import { isAtPage } from '@core/helpers/hashHelper';
import menu from '@core/implementations/menu';

class BeamboxGlobalInteraction {
  constructor() {
    tabController.onFocused(() => {
      this.attach();
    });
  }

  attach = () => {
    if (isAtPage('welcome')) {
      menu.attach(['CLEAR_SCENE', 'OPEN', 'RECENT', 'SAMPLES']);
    } else if (isAtPage('editor')) {
      // enable all
      menu.attach();
      menu.checkCurveEngraving();
      this.onObjectBlur();
      this.onObjectFocus();
      this.onCanvasModeChange();
    } else {
      // disable all
      menu.attach([]);
    }
  };

  onObjectFocus(elems?: Element[]) {
    let selectedElements = elems || selectionManager.getSelectedElements();

    if (!selectedElements?.length) {
      return;
    }

    const firstElement = selectedElements[0];
    const { tagName } = firstElement;

    menu.enable(['DUPLICATE', 'DELETE', 'PATH']);

    if (tagName === 'image') {
      menu.enable(['PHOTO_EDIT']);
      menu.disable(['PATH']);
    } else if (tagName === 'use') {
      menu.enable(['SVG_EDIT']);

      if (firstElement.getAttribute('data-svg') === 'true' || firstElement.getAttribute('data-dxf') === 'true') {
        menu.disable(['PATH']);
      }
    } else if (tagName === 'path') {
      menu.enable(['DECOMPOSE_PATH']);
    }

    const { canGroup, canUngroupOrDisassemble } = useSelectedElementStore.getState();

    if (canGroup) menu.enable(['GROUP']);

    if (canUngroupOrDisassemble) menu.enable(['UNGROUP']);
  }

  onObjectBlur() {
    menu.disable(['GROUP', 'UNGROUP', 'DUPLICATE', 'DELETE', 'PATH', 'DECOMPOSE_PATH', 'PHOTO_EDIT', 'SVG_EDIT']);
  }

  onCanvasModeChange(isPathPreviewMode = useCanvasStore.getState().mode === CanvasMode.PathPreview) {
    const menuItems = [
      'SHOW_LAYER_CONTROLS_PANEL',
      'SHOW_OBJECT_CONTROLS_PANEL',
      'SHOW_PATH_CONTROLS_PANEL',
      'RESET_LAYOUT',
    ];

    if (isAtPage('editor') && !isPathPreviewMode) {
      menu.enable(menuItems);
    } else {
      menu.disable(menuItems);
    }
  }

  detach() {
    menu.detach();
  }
}

const beamboxGlobalInteraction = new BeamboxGlobalInteraction();

export default beamboxGlobalInteraction;
