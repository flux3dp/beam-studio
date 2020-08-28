define([
], function (
) {
    const React = require('react');
    const { createContext } = React;
    const ZoomBlockContext = createContext();

    class ZoomBlockContextProvider extends React.Component {
        constructor(props) {
            super(props);
            this.state = {
            }
        }

        updateZoomBlock = () => {
            this.setState(this.state);
        }

        render() {
            const {
                updateZoomBlock
            } = this;
            return (
                <ZoomBlockContext.Provider value={{
                    updateZoomBlock,
                }}>
                    {this.props.children}
                </ZoomBlockContext.Provider>
            );
        }
    };

    return {ZoomBlockContextProvider, ZoomBlockContext};
});