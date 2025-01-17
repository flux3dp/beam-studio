export interface IButton {
  type?: string,
  dataAttrs?: { [key: string]: string|number; },
  className?: string,
  right?: boolean,
  label?: string,
  href?: string,
  onClick?: () => void,
  onMouseDown?: () => void,
  onMouseUp?: () => void,
  onMouseLeave?: () => void,
  title?: string,
}
