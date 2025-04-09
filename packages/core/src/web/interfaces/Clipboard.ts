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

  getRefFromClipboard(id: string): Element | undefined;

  hasData(): Promise<boolean>;
}

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
