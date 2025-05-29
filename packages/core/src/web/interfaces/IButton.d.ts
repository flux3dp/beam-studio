export interface IButton {
  className?: string;
  dataAttrs?: { [key: string]: number | string };
  href?: string;
  label?: string;
  onClick?: () => void;
  onMouseDown?: () => void;
  onMouseLeave?: () => void;
  onMouseUp?: () => void;
  right?: boolean;
  title?: string;
  type?: 'default' | 'primary';
}
