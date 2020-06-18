const { nodeName } = require('jquery');

define([
], function (
) {
    const React = require('react');
    const { createContext } = React;
    const TopBarContext = createContext();

    class TopBarContextProvider extends React.Component {
        constructor(props) {
            super(props);
            this.state = {
                fileName: null,
                selectedElem: null,
                hasUnsavedChange: true,
                isDrawing: false,
                isDrawn: false
            }
        }

        updateTopBar = () => {
            this.setState(this.state);
        }

        setHasUnsavedChange = (hasUnsavedChange) => {
            this.setState({hasUnsavedChange});
        }

        setElement = (elem) => {
            this.setState({selectedElem: elem});
        }

        setFileName = (fileName) => {
            this.setState({fileName});
        }

        setPreviewModeIsDrawing = (isDrawing) => {
            this.setState({isDrawing})
        }

        setPreviewModeIsDrawn = (isDrawn) => {
            this.setState({isDrawn})
        }

        render() {
            const {
                updateTopBar,
                setElement,
                setFileName,
                setHasUnsavedChange,
            } = this;
            const {
                fileName,
                selectedElem,
                hasUnsavedChange,
            } = this.state;
            return (
                <TopBarContext.Provider value={{
                    updateTopBar,
                    setElement,
                    setFileName,
                    setHasUnsavedChange,
                    fileName,
                    selectedElem,
                    hasUnsavedChange,
                }}>
                    {this.props.children}
                </TopBarContext.Provider>
            );
        }
    };

    return {TopBarContextProvider, TopBarContext};
});