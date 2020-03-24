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
                show: false
            };
        }

        componentDidMount() {
            BeamboxStore.onShowAboutBeambox(this._show.bind(this));

        }

        componentWillUnmount() {
        }

        _show = () => {
            this.setState({
                show: true
            });
        }

        _close = () => {
            this.setState({show: false});
        }

        render() {
            if (this.state.show) {
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
                );
            } else {
                return (
                    <div></div>
                )
            }
            
        }
    };

    return AboutBeamStudio;
});
