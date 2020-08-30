import Modal from '../widgets/Modal'
import ButtonGroup from '../widgets/Button-Group'
import initializeMachine from '../actions/initialize-machine'
import AlertActions from '../actions/alert-actions'
import BeamboxPreference from '../actions/beambox/beambox-preference'
import sprintf from '../../helpers/sprintf'
import * as i18n from '../../helpers/i18n'

    const React = requireNode('react');;
    const LANG = i18n.lang.initialize;

    export default function () {
        class ConnectBeamo extends React.Component{
            onStart = () => {
                BeamboxPreference.write('model', 'fbm1');

                let pokeIPAddr = localStorage.getItem('poke-ip-addr');
                const deviceIP = (document.getElementById('machine_ip_init') as HTMLInputElement).value;

                if (deviceIP) {
                    if (!deviceIP.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/)) {
                        return AlertActions.showPopupError('ip-wrong', LANG.ip_wrong);
                    }
                    if (pokeIPAddr && pokeIPAddr !== '') {
                        let pokeIPAddrArr = pokeIPAddr.split(/[,;] ?/);
                        if (pokeIPAddrArr.indexOf(deviceIP) === -1) {
                            if (pokeIPAddrArr.length > 19) {
                                pokeIPAddr = pokeIPAddrArr.slice(pokeIPAddrArr.length - 19, pokeIPAddrArr.length).join();
                            }
                            localStorage.setItem('poke-ip-addr', `${pokeIPAddr}, ${deviceIP}`);
                        }
                    } else {
                        localStorage.setItem('poke-ip-addr', deviceIP);
                    }
                }

                initializeMachine.completeSettingUp(true);
                location.reload();
            }
            onOpenTutorialLink = () => {
                const url = sprintf(LANG.tutorial_url, "beamo");
                window.open(url);
            }
            _renderSelectMachineStep = () => {
                var buttons = [
                    {
                        label: LANG.please_see_tutorial_video,
                        className: 'btn btn-link btn-large',
                        type: 'link',
                        onClick: this.onOpenTutorialLink
                    },
                    {
                        label: LANG.start,
                        className: 'btn btn-action btn-large start',
                        onClick: this.onStart,
                        href: '#initialize/connect/setup-complete/with-usb'
                    }
                ];
                return (
                    <div>
                        <h1 className="main-title">{sprintf(LANG.set_connection, "beamo")}</h1>
                        <div>{sprintf(LANG.please_goto_touchpad, "beamo")}</div>
                        <div className="tutorial">
                            {LANG.tutorial}
                            <input type="text" id="machine_ip_init" placeholder="x.x.x.x"></input>
                        </div>
                        <ButtonGroup className="btn-v-group" buttons={buttons}/>
                    </div>
                );
            }

            render() {
                const wrapperClassName = {
                    'initialization': true
                };
                const innerContent = this._renderSelectMachineStep();
                const content = (
                    <div className="connect-beambox text-center">
                        {innerContent}
                    </div>
                );

                return (
                    <Modal className={wrapperClassName} content={content} />
                );
            }
        };
        return ConnectBeamo;
    };
