import tabController from '@core/app/actions/tabController';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import menu from '@core/implementations/menu';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

class BeamboxGlobalInteraction {
  constructor() {
    tabController.onFocused(() => {
      this.onObjectBlur();
      this.onObjectFocus();
    });
  }

  attach() {
    menu.attach([
      'IMPORT',
      'SAVE_SCENE',
      'UNDO',
      'REDO',
      'EXPORT_FLUX_TASK',
      'DOCUMENT_SETTING',
      'CLEAR_SCENE',
      'ZOOM_IN',
      'ZOOM_OUT',
      'AUTO_ALIGN',
      'FITS_TO_WINDOW',
      'ZOOM_WITH_WINDOW',
      'SHOW_GRIDS',
      'SHOW_LAYER_COLOR',
      'NETWORK_TESTING',
      'ABOUT_BEAM_STUDIO',
    ]);
  }

  onObjectFocus(elems?: Element[]) {
    let selectedElements = elems || svgCanvas?.getSelectedElems().filter(Boolean);

    if (!selectedElements.length) {
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

    if (selectedElements.length > 0 && firstElement.getAttribute('data-tempgroup') === 'true') {
      selectedElements = Array.from(firstElement.childNodes) as Element[];
    }

    if (selectedElements?.length > 1 || (selectedElements?.length === 1 && tagName !== 'g')) {
      menu.enable(['GROUP']);
    }

    if (
      selectedElements &&
      selectedElements.length === 1 &&
      ['a', 'g', 'use'].includes(tagName) &&
      !firstElement.getAttribute('data-textpath-g') &&
      !firstElement.getAttribute('data-pass-through')
    ) {
      menu.enable(['UNGROUP']);
    }
  }

  onObjectBlur() {
    menu.disable(['GROUP', 'UNGROUP', 'DUPLICATE', 'DELETE', 'PATH', 'DECOMPOSE_PATH', 'PHOTO_EDIT', 'SVG_EDIT']);
  }

  detach() {
    menu.detach();
  }
}

const beamboxGlobalInteraction = new BeamboxGlobalInteraction();

export default beamboxGlobalInteraction;
