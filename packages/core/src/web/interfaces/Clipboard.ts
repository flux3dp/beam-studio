export interface ClipboardElement {
  attributes: Array<Record<'namespaceURI' | 'nodeName' | 'value', null | string>>;
  childNodes: ClipboardElement[];
  dataGSVG?: string;
  dataSymbol?: string;
  innerHTML: string;
  namespaceURI: null | string;
  nodeName: string;
  nodeType: number;
  nodeValue: null | string;
}

export interface ClipboardData {
  elements: ClipboardElement[];
  imageData: Record<string, string>;
  refs: Record<string, ClipboardElement>;
  // The source of the clipboard data, e.g., the current tab ID.
  // This can be used to identify where the clipboard data originated from.
  source: string;
}

export interface ClipboardCore {
  addRefToClipboard(useElement: SVGUseElement): void;

  /**
   * Copy the given elements to the clipboard.
   * @param elems The elements to copy.
   */
  copyElements(elems: Element[]): Promise<void>;

  /**
   * Get the data from the clipboard.
   */
  getData(): Promise<Element[]>;

  /**
   * Get the raw data from the clipboard.
   */
  getRawData(): Promise<ClipboardData | null>;

  getRefFromClipboard(id: string): Element | undefined;

  hasData(): Promise<boolean>;
}
