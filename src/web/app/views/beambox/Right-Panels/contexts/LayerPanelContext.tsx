
    const React = requireNode('react');;
    const { createContext } = React;
    export const LayerPanelContext = createContext();

    export class LayerPanelContextProvider extends React.Component {
        constructor(props) {
            super(props);
            this.state = {
            }
        }

        updateLayerPanel = () => {
            this.setState(this.state);
        }

        render() {
            const {
                updateLayerPanel
            } = this;
            return (
                <LayerPanelContext.Provider value={{
                    updateLayerPanel,
                }}>
                    {this.props.children}
                </LayerPanelContext.Provider>
            );
        }
    };