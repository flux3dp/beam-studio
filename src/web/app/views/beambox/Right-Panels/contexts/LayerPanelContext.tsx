const React = requireNode('react');
const { createContext } = React;
export const LayerPanelContext = createContext();
let id = 0;
export class LayerPanelContextProvider extends React.Component {
    private contextValue = {};
    private selectedLayers: string[] = [];
    constructor(props) {
        super(props);
        this.state = {};
        this.updateContextValue();
    }

    updateContextValue = () => {
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
    }

    setSelectedLayers = (selectedLayers: string[]) => {
        this.selectedLayers = [...selectedLayers];
        this.updateContextValue();
        this.setState(this.state);
    }

    updateLayerPanel = () => {
        this.setState(this.state);
    }

    render() {
        return (
            <LayerPanelContext.Provider value={this.contextValue}>
                {this.props.children}
            </LayerPanelContext.Provider>
        );
    }
};
