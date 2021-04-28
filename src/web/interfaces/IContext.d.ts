export interface IContext {
  Provider: () => Element,
}

export interface ILayerPanelContext extends IContext {
  selectedLayers?: string[],
  updateLayerPanel: () => void,
  setSelectedLayers: (layers: string[]) => null,
}
