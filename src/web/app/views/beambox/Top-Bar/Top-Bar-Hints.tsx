import * as i18n from '../../../../helpers/i18n';
const React = requireNode('react');
const LANG = i18n.lang.topbar;
const classNames = requireNode('classnames');
const { createContext } = React;
const HintContext = createContext();
let _context;

export class ContextHelper {
    static get context() {
        return _context;
    }
}

export const Constants = {
    POLYGON: 'POLYGON',
}

export class HintContextProvider extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hintType: null,
        }
    }

    setHint = (hintType) => {
        this.setState({hintType});
    }

    removeHint = () => {
        this.setState({hintType: null});
    }

    render() {
        const {
            setHint,
            removeHint
        } = this;

        const {
            hintType
        } = this.state;
        return (
            <HintContext.Provider value={{
                setHint,
                removeHint,
                hintType
            }}>
                {this.props.children}
            </HintContext.Provider>
        );
    }
}

class HintContextConsumer extends React.Component {
    componentDidMount() {
        _context = this.context;
    }

    componentWillUnmount() {
        _context = null;
    }

    renderTextHint(textContent) {
        return (
            <div>
                {textContent}
            </div>
        );
    }

    renderContent() {
        const { hintType } = this.context;
        if (!hintType) {
            return null;
        }
        if (hintType === Constants.POLYGON) {
            return this.renderTextHint(LANG.hint.polygon);
        } else {
            return null;
        }
    }

    render() {
        return (
            <div className='hint-container'>
                {this.renderContent()}
            </div>
        );
    }
};

HintContextConsumer.contextType = HintContext;

export class TopBarHints extends React.Component {
    render() {
        return (
            <HintContextProvider>
                <HintContextConsumer />
            </HintContextProvider>
        );
    }
}
