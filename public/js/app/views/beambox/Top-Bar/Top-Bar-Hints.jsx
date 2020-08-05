define([
    'helpers/i18n'
], function (
    i18n
) {
    const React = require('react');
    const LANG = i18n.lang.topbar;
    const classNames = require('classnames');
    const { createContext } = React;
    const HintContext = createContext();

    const ret = {};

    const Constants = {
        POLYGON: 'POLYGON',
    }
    ret.Constants = Constants;

    class HintContextProvider extends React.Component {
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
            ret.contextCaller = this.context;
        }

        componentWillUnmount() {
            ret.contextCaller = null;
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

    class TopBarHints extends React.Component {
        render() {
            return (
                <HintContextProvider>
                    <HintContextConsumer />
                </HintContextProvider>
            );
        }
    }
    ret.TopBarHints = TopBarHints;

    return ret;
});