define([
    'jsx!widgets/Modal',
    'app/stores/beambox-store',
    'helpers/i18n'
], function(
    Modal,
    BeamboxStore,
    i18n
) {
    const React = require('react');
    const LANG = i18n.lang.topmenu;

    
    class AboutBeamStudio extends React.Component {
        constructor(props) {
            super(props);
            this.state = {
            };
        }

        _close = () => {
            this.props.onClose();
        }

        render() {
            return (
                <Modal onClose={() => {this._close()}}>
                    <div className='about-beam-studio'>
                        <img src='icon.png'/>
                        <div className='app-name'>{'Beam Studio'}</div>
                        <div className='version'>{`${LANG.version} ${window.FLUX.version}`}</div>
                        <div className='copyright'>{'Copyright ⓒ 2019 FLUX Inc.'}</div>
                        <button
                            className='btn btn-default'
                            onClick={() => this._close()}
                        >{LANG.ok}
                        </button>
                    </div>
                </Modal>
            )
        }
    };

    return AboutBeamStudio;
});
