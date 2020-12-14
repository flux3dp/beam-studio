import Modal from '../widgets/Modal';
import ButtonGroup from '../widgets/Button-Group';
import config from '../../helpers/api/config';
import sprintf from '../../helpers/sprintf';
import * as i18n from '../../helpers/i18n';
import DeviceMaster from '../../helpers/device-master';
const React = requireNode('react');

class UpdateDialog extends React.Component{

    _onSkip = () => {
        var key = this.props.type + '-update-ignore-list',
            ignoreList = (config().read(key) || []) as Array<string>;

        ignoreList.push(this.props.latestVersion);

        // save skip version and close
        config().write(key, ignoreList);
        this._onClose();
    }
    _onDownload = () => {
        console.log('onDownload this.props', this.props);
        this.props.onDownload();
        this._onClose();
    }

    _onClose = (quit?: boolean) => {
        if ('toolhead' === this.props.type && quit) {
            DeviceMaster.quitTask();
        }

        this.props.onClose();
    }

    _onInstall = () => {
        this.props.onInstall();
        this._onClose();
    }

    _getButtons = (lang) => {
        var buttons,
            laterButton = {
                label: lang.update.later,
                dataAttrs: {
                    'ga-event': 'update-' + this.props.type.toLowerCase() + '-later'
                },
                onClick: this._onClose.bind(this, true)
            },
            downloadButton = {
                label: lang.update.download,
                dataAttrs: {
                    'ga-event': 'download-' + this.props.type.toLowerCase() + '-later'
                },
                onClick: () => {this._onDownload()}
            },
            installButton = {
                label: ('software' === this.props.type ?
                    lang.update.install :
                    lang.update.upload
                ),
                dataAttrs: {
                    'ga-event': 'install-new-' + this.props.type.toLowerCase()
                },
                className: 'btn-default primary',
                onClick: () => {this._onInstall()}
            };

        buttons = (this.props.type === 'software') ?
            [laterButton, installButton] :
            [laterButton, downloadButton, installButton];

        return buttons;
    }

    _getReleaseNote = () => {
        return {
            __html: this.props.releaseNote
        };
    }

    render() {
        if (false === this.props.open) {
            return <div/>;
        }

        var lang = i18n.lang,
            caption = lang.update[this.props.type].caption,
            deviceModel = this.props.device.model,
            message1 = sprintf(lang.update[this.props.type].message_pattern_1, this.props.device.name),
            message2 = sprintf(lang.update[this.props.type].message_pattern_2, deviceModel, this.props.latestVersion, this.props.currentVersion),
            buttons = this._getButtons(lang),
            skipButton = (
                'software' === this.props.type ?
                    (<button className="btn btn-link" data-ga-event={'skip-' + this.props.type.toLowerCase() + '-update'} onClick={this._onSkip}>
                        {lang.update.skip}
                    </button>) :
                    ''
            ),
            content = (
                <div className="update-wrapper">
                    <h2 className="caption">{caption}</h2>
                    <article className="update-brief">
                        <p>{message1}</p>
                        <p>{message2}</p>
                    </article>
                    <h4 className="release-note-caption">{lang.update.release_note}</h4>
                    <div className="release-note-content" dangerouslySetInnerHTML={this._getReleaseNote()}/>
                    <div className="action-button">
                        {skipButton}
                        <ButtonGroup buttons={buttons}/>
                    </div>
                </div>
            ),
            className = {
                'modal-update': true,
                'shadow-modal': true
            };

        return (
            <Modal ref="modal" className={className} content={content}/>
        );
    }

};

UpdateDialog.defaultProps = {
    open: false,
    type: 'software',   // software|firmware|toolhead
    device: {},
    currentVersion: '',
    latestVersion: '',
    releaseNote: '',
    updateFile: undefined,
    onDownload: function() {},
    onClose: function() {},
    onInstall: function() {}
}

export default UpdateDialog;
