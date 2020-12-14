const React = requireNode('react');
const { createContext } = React;
export const RightPanelContext = createContext();

export class RightPanelContextProvider extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            mode: 'element',
            selectedElement: null,
        }
    }

    setMode = (mode) => {
        const {mode: currentMode} = this.state;
        if (['path-edit'].includes(mode) || currentMode !== mode) {
            this.setState({ mode });
        }
    }

    setSelectedElement = (elems) => {
        if (elems !== this.state.selectedElement) {
            (document.activeElement as HTMLInputElement).blur();
        }
        this.setState({selectedElement: elems});
    }

    render() {
        const {
            setMode,
            setSelectedElement,
        } = this;
        const {
            mode,
            selectedElement,
        } = this.state;
        return (
            <RightPanelContext.Provider value={{
                setMode,
                mode,
                setSelectedElement,
                selectedElement,
            }}>
                {this.props.children}
            </RightPanelContext.Provider>
        );
    }
};
