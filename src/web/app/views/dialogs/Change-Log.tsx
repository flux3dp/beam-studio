const React = requireNode('react');

import Modal from 'app/widgets/Modal';
import i18n from 'helpers/i18n';

const LANG = i18n.lang.change_logs;

const CHANGES_TW = {
    added: [
        'Change Log Dialog'
    ],
    fixed: [
    ],
    changed: [
    ],
};

const CHANGES_EN = {
    added: [
        'Change Log Dialog'
    ],
    fixed: [
    ],
    changed: [
    ],
};
const FLUX = window['FLUX'];


class ChangeLogDialog extends React.Component {
    renderChangeLogs () {
        const activeLang = i18n.getActiveLang();
        const CHANGES = activeLang.startsWith('zh') ? CHANGES_TW : CHANGES_EN;
        const logs = [];
        if (CHANGES.added.length > 0) {
            logs.push(<div className='change-log-category' key={'added'}>{LANG.added}</div>);
            for (let i = 0; i < CHANGES.added.length; i++) {
                logs.push(
                    <div className='change-log-item' key={`added-${i}`}>
                        <div className='index'>{`${i + 1}.`}</div>
                        <div className='log'>{CHANGES.added[i]}</div>
                    </div>
                );
            }
        }
        if (CHANGES.fixed.length > 0) {
            logs.push(<div className='change-log-category' key={'fixed'}>{LANG.fixed}</div>);
            for (let i = 0; i < CHANGES.fixed.length; i++) {
                logs.push(
                    <div className='change-log-item' key={`fixed-${i}`}>
                        <div className='index'>{`${i + 1}.`}</div>
                        <div className='log'>{CHANGES.fixed[i]}</div>
                    </div>
                );
            }
        }
        if (CHANGES.changed.length > 0) {
            logs.push(<div className='change-log-category' key={'changed'}>{LANG.changed}</div>);
            for (let i = 0; i < CHANGES.changed.length; i++) {
                logs.push(
                    <div className='change-log-item' key={`changed-${i}`}>
                        <div className='index'>{`${i + 1}.`}</div>
                        <div className='log'>{CHANGES.changed[i]}</div>
                    </div>
                );
            }
        }
        return logs;
    }

    onClose = () => {
        const { onClose } = this.props;
        onClose();
    }

    render() {
        const { version } = FLUX;
        const changeLogs = this.renderChangeLogs();
        if (changeLogs.length === 0) {
            console.warn('Change log is empty.');
            this.onClose();
            return null;
        }
        return (
            <Modal>
                <div className='change-log-dialog'>
                    <div className='header'>
                        <img src='icon.png'/>
                        <div className='app'>{`Beam Studio ${version.replace('-', ' ')}`}</div>
                    </div>
                    <div className='title'>{LANG.change_log}</div>
                    <div className='change-log-container'>
                        {changeLogs}
                    </div>
                    <div className='link' onClick={
                        () => {
                            const electron = requireNode('electron');
                            electron.remote.shell.openExternal(LANG.help_center_url);
                        }}
                    >
                        {LANG.see_older_version}
                    </div>
                    <div className='footer'>
                        <button
                            className='btn btn-default primary'
                            onClick={() => {this.onClose()}}
                        >
                            {'OK'}
                        </button>
                    </div>
                </div>
            </Modal>
        )
    }
};

export default ChangeLogDialog;
