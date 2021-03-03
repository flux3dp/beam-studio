const React = requireNode('react');
const classNames = requireNode('classnames');

import { Mode } from 'app/constants/monitor-constants';
import { MonitorContext } from 'app/contexts/Monitor-Context';
import FormatDuration from 'helpers/duration-formatter';
import MonitorStatus from 'helpers/monitor-status';
import VersionChecker from 'helpers/version-checker';
import i18n from 'helpers/i18n';

const defaultImage = 'img/ph_l.png';
const LANG = i18n.lang;

export default class MonitorTask extends React.PureComponent {
    renderImage() {
        const { taskImageURL } = this.context;
        const divStyle = {
            borderRadius: '2px',
            backgroundColor: '#F0F0F0',
            backgroundImage: `url(${taskImageURL || defaultImage})`,
            backgroundSize: '100% auto',
            backgroundPosition: '50% 50%',
            backgroundRepeatY: 'no-repeat',
            width: '100%',
            height: '100%'
        };

        return (<div style={divStyle} />);
    }

    getJobTime() {
        const { taskTime } = this.context;

        if (taskTime) {
            return FormatDuration(taskTime)
        } else {
            return null;
        }
    }

    getProgress() {
        const { mode, report } = this.context;
        if(mode !== Mode.WORKING || MonitorStatus.isAbortedOrCompleted(report)) {
            return '';
        }
        return report.prog !== undefined ? `${(report.prog * 100).toFixed(1)}%` : '';
    }

    renderRelocateButton() {
        const { mode, relocateOrigin, startRelocate } = this.context;
        const { device } = this.props;
        const vc = VersionChecker(device.version);
        if ([Mode.PREVIEW, Mode.FILE_PREVIEW].includes(mode) && vc.meetRequirement('RELOCATE_ORIGIN')) {
            return (
                <div className="btn-relocate-container">
                    <div className="btn-relocate" onClick={startRelocate}>
                        <img src="img/beambox/icon-target.svg"/>
                        {(relocateOrigin.x !== 0 || relocateOrigin.y !== 0) ? 
                            <div className="relocate-origin">{`(${relocateOrigin.x}, ${relocateOrigin.y})`}</div>
                            : null
                        }
                    </div>
                </div>
            );
        } else {
            return null;
        }
    }

    renderInfo() {
        const infoClass = classNames('status-info', 'running', { hide: this._isAbortedOrCompleted, });
        return (
            <div className={infoClass}>
                <div className="verticle-align">
                    <div>{LANG.monitor.task.BEAMBOX}</div>
                    <div className="status-info-duration">{this.getJobTime()}</div>
                </div>
                {this.renderRelocateButton()}
                <div className="status-info-progress">{this.getProgress()}</div>
            </div>
        );
    }

    render() {
        return (
            <div className='task'>
                {this.renderImage()}
                {this.renderInfo()}
            </div>
        );
    }
}

MonitorTask.contextType = MonitorContext;
