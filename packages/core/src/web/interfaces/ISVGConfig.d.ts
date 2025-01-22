export default interface ISVGConfig {
  allowedOrigins?: string[];
  baseUnit?: string;
  // Todo: svgcanvas.js also sets and checks: show_outside_canvas add here?
  // Change the following to preferences and
  // add pref controls to the UI (e.g., initTool, wireframe, showlayers)?
  canvasName?: string;
  defaultUnit?: string;
  // DOCUMENT PROPERTIES
  // Change the following to a preference (already in the Document Properties dialog)?
  dimensions?: number[];
  // Used by ext-storage.js; empty any prior storage if the user declines to store
  emptyStorageOnDecline?: boolean;
  exportWindowType?: string; // 'same' (todo: also support 'download')
  extensions?: any[];
  extPath?: string;
  // Some interaction with ext-storage.js;
  // strongly discouraged from modification as it bypasses user privacy by preventing them
  // from choosing whether to keep local storage or not
  forceStorage?: boolean;
  // EDITOR OPTIONS
  // Change the following to preferences (already in the Editor Options dialog)?
  gridSnapping?: boolean;
  // PATH CONFIGURATION
  // The following path configuration items are disallowed
  // in the URL (as should any future path configurations)
  imgPath?: string;
  initFill?: {
    color: string;
    opacity: number;
  };
  initOpacity?: number;
  initStroke?: {
    color: string; // solid black
    opacity: number;
    width: number;
  };
  initTool?: string;
  langPath?: string;
  // EXTENSION CONFIGURATION (see also preventAllURLConfig)
  lockExtensions?: boolean; // Disallowed in URL setting
  no_save_warning?: boolean;
  // noDefaultExtensions can only be meaningfully used in config.js or in the URL
  noDefaultExtensions?: boolean;
  // EXTENSION-RELATED (STORAGE)
  // Some interaction with ext-storage.js;
  // prevent even the loading of previously saved local storage
  noStorageOnLoad?: boolean;
  // URL BEHAVIOR CONFIGURATION
  preventAllURLConfig?: boolean;
  preventURLContentLoading?: boolean;
  // EXTENSION-RELATED (GRID)
  showGrid?: true; // Set by ext-grid.js
  showlayers?: boolean;
  snappingStep?: number;
  text?: {
    fill: string;
    fill_opacity: string;
    font_family: string;
    font_postscriptName: string;
    font_size: number;
    stroke_width: 1;
    text_anchor: string;
  };
  wireframe?: boolean;
}
