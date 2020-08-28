define([
], function (
) {
    const React = require('react');
    const { createContext } = React;
    const LayerPanelContext = createContext();

    class LayerPanelContextProvider extends React.Component {
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

    return {LayerPanelContextProvider, LayerPanelContext};
});