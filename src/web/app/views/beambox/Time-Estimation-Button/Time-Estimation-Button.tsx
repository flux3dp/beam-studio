import ExportFuncs from '../../../actions/beambox/export-funcs';
import FormatDuration from '../../../../helpers/duration-formatter';
import * as i18n from '../../../../helpers/i18n';

const React = requireNode('react');
const classNames = requireNode('classnames');
const { createContext } = React;
const TimeEstimationButtonContext = createContext();
let _context = null;
const LANG = i18n.lang.beambox.time_est_button;

interface ITimeEstimationButtonContext {
    estimatedTime: number|null,
    setEstimatedTime(estimatedTime: number|null): void,
};

class TimeEstimationButtonContextProvider extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            estimatedTime: null,
        };
    }

    setEstimatedTime = (estimatedTime: number|null) => {
        if (estimatedTime !== this.state.estimatedTime) {
            this.setState({ estimatedTime });
        }
    }

    render() {
        const { setEstimatedTime } = this;
        const { estimatedTime } = this.state;
        return(
            <TimeEstimationButtonContext.Provider value={{
                setEstimatedTime,
                estimatedTime,
            }}>
                {this.props.children}
            </TimeEstimationButtonContext.Provider>
        );
    }
};

class TimeEstimationButtonComponent extends React.Component {
    componentDidMount() {
        _context = this.context;
    }

    async calculateEstimatedTime() {
        const { setEstimatedTime } = this.context as ITimeEstimationButtonContext;
        const estimatedTime = await ExportFuncs.estimateTime();
        setEstimatedTime(estimatedTime);
    }

    renderButton() {
        return (
            <div className='time-est-btn' onClick={() => this.calculateEstimatedTime()}>
                {LANG.calculate}
            </div>
        )
    }

    renderResult(estimatedTime: number) {
        const message = `Estimated Time: ${FormatDuration(estimatedTime)}`;
        return (
            <div className='time-est-result'>
                { message }
            </div>
        )
    }

    render() {
        const { estimatedTime } = this.context as ITimeEstimationButtonContext;
        return (
            <div className='time-est-btn-container'>
                {estimatedTime ? this.renderResult(estimatedTime) : this.renderButton()}
            </div>
        );
    }
};
TimeEstimationButtonComponent.contextType = TimeEstimationButtonContext;

export class TimeEstimationButton extends React.Component {
    render() {
        return (
            <TimeEstimationButtonContextProvider>
                <TimeEstimationButtonComponent />
            </TimeEstimationButtonContextProvider>
        );
    }
};

export class ContextHelper {
    static get context() {
        return _context as ITimeEstimationButtonContext;
    }
};

