import Modal from '../../widgets/Modal';
import * as i18n from '../../../helpers/i18n';
const React = requireNode('react');
const LANG = i18n.lang.topmenu;
const FLUX = window['FLUX'];


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
                    <div className='version'>{`${LANG.version} ${FLUX.version}`}</div>
                    <div className='copyright'>{'Copyright ⓒ 2021 FLUX Inc.'}</div>
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

export default AboutBeamStudio;
