define([
], function (
) {
    const React = require('react');
    const { createContext } = React;
    const RightPanelContext = createContext();

    class RightPanelContextProvider extends React.Component {
        constructor(props) {
            super(props);
            this.state = {
            }
        }

        setSelectedElement = (elems) => {
            document.activeElement.blur();
            this.setState({selectedElement: elems});
        }

        render() {
            const {
                setSelectedElement
            } = this;
            const {
                selectedElement
            } = this.state;
            return (
                <RightPanelContext.Provider value={{
                    setSelectedElement,
                    selectedElement,
                }}>
                    {this.props.children}
                </RightPanelContext.Provider>
            );
        }
    };

    return {RightPanelContextProvider, RightPanelContext};
});