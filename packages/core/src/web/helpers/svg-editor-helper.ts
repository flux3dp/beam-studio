import type { ISVGEditor } from '@core/app/actions/beambox/svg-editor';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

interface ISVGGlobal {
  Canvas: ISVGCanvas;
  Edit: any;
  Editor: ISVGEditor;
}

export const getSVGCanvas = () => {
  if (!window.svgCanvas) {
    throw new Error('Access to svgCanvas before svgCanvas was inited');
  }

  return window.svgCanvas;
};

export const getSVGEditor = () => window.svgEditor;

export const getSVGEdit = () => window.svgedit;

export const getSVGAsync = (callback: (p: ISVGGlobal) => void): void => {
  const refreshTimer = setInterval(() => {
    if (!window.svgCanvas) {
      return;
    }

    if (!window.svgEditor) {
      return;
    }

    callback({
      Canvas: getSVGCanvas(),
      Edit: getSVGEdit(),
      Editor: getSVGEditor(),
    });
    clearInterval(refreshTimer);
  }, 200);
};
