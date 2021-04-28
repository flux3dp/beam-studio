import { ILayerPanelContext } from 'interfaces/IContext';

const React = requireNode('react');
const PropTypes = requireNode('prop-types');
const { createContext } = React;

export const LayerPanelContext: ILayerPanelContext = createContext();
export class LayerPanelContextProvider extends React.Component {
  private contextValue = {};

  private selectedLayers: string[] = [];

  constructor(props: { children?: Element | Element[] }) {
    super(props);
    this.state = {};
    this.updateContextValue();
  }

  updateContextValue = (): void => {
    const {
      selectedLayers,
      setSelectedLayers,
      updateLayerPanel,
    } = this;
    this.contextValue = {
      selectedLayers,
      setSelectedLayers,
      updateLayerPanel,
    };
  };

  setSelectedLayers = (selectedLayers: string[]): void => {
    this.selectedLayers = [...selectedLayers];
    this.updateContextValue();
    this.forceUpdate();
  };

  updateLayerPanel = (): void => {
    this.forceUpdate();
  };

  render(): Element {
    const { children } = this.props;
    return (
      <LayerPanelContext.Provider value={this.contextValue}>
        {children}
      </LayerPanelContext.Provider>
    );
  }
}

LayerPanelContextProvider.propTypes = {
  children: PropTypes.element,
};

LayerPanelContextProvider.defaultProps = {
  children: null,
};
