const React = requireNode('react');
const { createContext } = React;
export const ObjectPanelContext = createContext();

const minRenderInterval = 200;

export class ObjectPanelContextProvider extends React.Component {
    constructor(props) {
        super(props);
        this.dimensionValues = {}
        this.state = {
            lastUpdateTime: Date.now()
        }
    }

    componentDidUpdate() {
    }

    updateDimensionValues = (newValues) => {
        this.dimensionValues = {
            ...this.dimensionValues, ...newValues
        };
    }

    getDimensionValues = (key) => {
        if (key) {
            return this.dimensionValues[key];
        }
        return this.dimensionValues;
    }

    updateObjectPanel = () => {
        clearTimeout(this.updateTimeout);
        const time = Date.now();
        const { lastUpdateTime } = this.state;
        if (time - lastUpdateTime >= minRenderInterval) {
            this.setState({lastUpdateTime: time});
        } else {
            this.updateTimeout = setTimeout(() => {
                this.setState({
                    lastUpdateTime: lastUpdateTime + minRenderInterval
                });
            }, lastUpdateTime + minRenderInterval - time);
        }
    }


    render() {
        const {
            dimensionValues,
            updateDimensionValues,
            getDimensionValues,
            updateObjectPanel
        } = this;
        return (
            <ObjectPanelContext.Provider value={{
                dimensionValues,
                updateDimensionValues,
                getDimensionValues,
                updateObjectPanel
            }}>
                {this.props.children}
            </ObjectPanelContext.Provider>
        );
    }
};
