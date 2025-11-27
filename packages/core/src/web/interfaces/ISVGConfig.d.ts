export default interface ISVGConfig {
  allowedOrigins?: string[];
  baseUnit?: string;
  // Todo: svgcanvas.js also sets and checks: show_outside_canvas add here?
  // Change the following to preferences and
  // add pref controls to the UI (e.g., initTool, wireframe, showlayers)?
  canvasName?: string;
  // DOCUMENT PROPERTIES
  // Change the following to a preference (already in the Document Properties dialog)?
  dimensions?: number[];
  exportWindowType?: string; // 'same' (todo: also support 'download')
  extensions?: any[];
  extPath?: string;
  // EDITOR OPTIONS
  // Change the following to preferences (already in the Editor Options dialog)?
  gridSnapping?: boolean;
  // PATH CONFIGURATION
  // The following path configuration items are disallowed
  // in the URL (as should any future path configurations)
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
