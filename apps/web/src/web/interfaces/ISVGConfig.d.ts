export default interface ISVGConfig {
  // Todo: svgcanvas.js also sets and checks: show_outside_canvas add here?
  // Change the following to preferences and
  // add pref controls to the UI (e.g., initTool, wireframe, showlayers)?
  canvasName?: string
  initFill?: {
    color: string,
    opacity: number
  }
  initStroke?: {
    width: number,
    color: string, // solid black
    opacity: number
  }
  text?: {
    stroke_width: 1,
    font_size: number,
    font_family: string,
    font_postscriptName: string,
    fill: string,
    fill_opacity: string,
    text_anchor: string
  },
  initOpacity?: number,
  initTool?: string,
  exportWindowType?: string, // 'same' (todo: also support 'download')
  wireframe?: boolean,
  showlayers?: boolean,
  no_save_warning?: boolean,
  // PATH CONFIGURATION
  // The following path configuration items are disallowed
  // in the URL (as should any future path configurations)
  imgPath?: string,
  langPath?: string,
  extPath?: string,
  // DOCUMENT PROPERTIES
  // Change the following to a preference (already in the Document Properties dialog)?
  dimensions?: number[],
  // EDITOR OPTIONS
  // Change the following to preferences (already in the Editor Options dialog)?
  gridSnapping?: boolean,
  baseUnit?: string,
  defaultUnit?: string,
  snappingStep?: number,
  // URL BEHAVIOR CONFIGURATION
  preventAllURLConfig?: boolean,
  preventURLContentLoading?: boolean,
  // EXTENSION CONFIGURATION (see also preventAllURLConfig)
  lockExtensions?: boolean, // Disallowed in URL setting
  // noDefaultExtensions can only be meaningfully used in config.js or in the URL
  noDefaultExtensions?: boolean,
  // EXTENSION-RELATED (GRID)
  showGrid?: true, // Set by ext-grid.js
  // EXTENSION-RELATED (STORAGE)
  // Some interaction with ext-storage.js;
  // prevent even the loading of previously saved local storage
  noStorageOnLoad?: boolean,
  // Some interaction with ext-storage.js;
  // strongly discouraged from modification as it bypasses user privacy by preventing them
  // from choosing whether to keep local storage or not
  forceStorage?: boolean,
  // Used by ext-storage.js; empty any prior storage if the user declines to store
  emptyStorageOnDecline?: boolean
  extensions?: any[],
  allowedOrigins?: string[]
}
