export default interface ISVGConfig {
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
