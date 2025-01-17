export default interface IShapeStyle {
  fill: string,
  fill_paint: string | null,
  fill_opacity: number,
  stroke: string,
  stroke_paint: string | null,
  stroke_opacity: number,
  stroke_width: number,
  stroke_dasharray: 'none',
  stroke_linejoin: 'miter',
  stroke_linecap: 'butt',
  opacity: number,
}
