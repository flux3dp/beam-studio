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

        setTopBarPreviewMode = (isPreviewMode) => {
            this.isPreviewMode = isPreviewMode;
        }

        getTopBarPreviewMode = () => {
            return this.isPreviewMode;
        }

        setShouldStartPreviewController = (shouldStartPreviewController) => {
            this.setState({shouldStartPreviewController});
        }

        render() {
            const {
                updateTopBar,
                setElement,
                setFileName,
                setHasUnsavedChange,
                setTopBarPreviewMode,
                getTopBarPreviewMode,
                setShouldStartPreviewController,
                isPreviewMode,
            } = this;
            const {
                fileName,
                selectedElem,
                hasUnsavedChange,
                shouldStartPreviewController,
            } = this.state;
            return (
                <TopBarContext.Provider value={{
                    updateTopBar,
                    setElement,
                    setFileName,
                    setHasUnsavedChange,
                    setTopBarPreviewMode,
                    getTopBarPreviewMode,
                    setShouldStartPreviewController,
                    isPreviewMode,
                    fileName,
                    selectedElem,
                    hasUnsavedChange,
                    shouldStartPreviewController,
                }}>
                    {this.props.children}
                </TopBarContext.Provider>
            );
        }
    };

    return {TopBarContextProvider, TopBarContext};
});