const React = requireNode('react');
const { createContext } = React;
export const ZoomBlockContext = createContext();

export class ZoomBlockContextProvider extends React.Component {
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
