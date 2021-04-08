import alert from 'app/actions/alert-caller';
import Modal from 'app/widgets/Modal';
import ShowablePasswordInput from 'app/widgets/Showable-Password-Input';
import { fluxIDEvents, externalLinkFBSignIn, externalLinkGoogleSignIn, signIn, signOut } from 'helpers/api/flux-id';
import storage from 'helpers/storage-helper';
import i18n from 'helpers/i18n';

const electron = requireNode('electron');

let LANG = i18n.lang.flux_id_login;
const updateLang = () => {
    LANG = i18n.lang.flux_id_login;
};

const classNames = requireNode('classnames');
const React = requireNode('react');
const { useRef, useEffect, useState } = requireNode('react');

const FluxIdLogin = ({ onClose }) => {
    updateLang();

    const emailInput = useRef(null);
    const passwordInput = useRef(null);
    const rememberMeCheckbox = useRef(null);
    const [isRememberMeChecked, setIsRememberMeChecked] = useState(!!storage.get('keep-flux-id-login'));

    useEffect(() => {
        fluxIDEvents.on('oauth-logged-in', onClose);
        return () => {
            fluxIDEvents.removeListener('oauth-logged-in', onClose);
            const isChecked = rememberMeCheckbox.current.checked;
            storage.set('keep-flux-id-login', isChecked);
        };
    }, []);

    const renderOAuthContent = () => {
        return (
            <div className='oauth'>
                <div className={classNames('button facebook')} onClick={externalLinkFBSignIn}>
                    {'Continue with Facebook'}
                </div>
                <div className={classNames('button google')} onClick={externalLinkGoogleSignIn}>
                    {'Continue with Google'}
                </div>
            </div>
        );
    };

    const renderSeperator = () => {
        return <div className='sep'>{'or'}</div>;
    };

    const renderLoginInputs = () => {
        const lost_password_url = LANG.lost_password_url;
        return (
            <div className='login-inputs'>
                <input
                    id='email-input'
                    type='text'
                    placeholder={LANG.email} 
                    ref={emailInput}
                    onKeyDown={(e: KeyboardEvent) => e.stopPropagation()}
                />
                <ShowablePasswordInput
                    id = {'password-input'}
                    ref={passwordInput}
                    placeholder={LANG.password}
                />
                <div className='options'>
                    <div className='remember-me' onClick={() => setIsRememberMeChecked(!isRememberMeChecked)}>
                        <input ref={rememberMeCheckbox} type='checkbox' checked={isRememberMeChecked} onChange={() => {}}/>
                        <div>{LANG.remember_me}</div>
                    </div>
                    <div className='forget-password' onClick={() => electron.remote.shell.openExternal(lost_password_url)}>{LANG.forget_password}</div>
                </div>
            </div>
        );
    };

    const renderFooterButtons = () => {
        const signup_url = LANG.signup_url;
        return (
            <div className='footer'>
                <div className={classNames('button', 'primary')} onClick={handleLogin}>{LANG.login}</div>
                <div className={classNames('button')} onClick={() => electron.remote.shell.openExternal(signup_url)}>{LANG.register}</div>
                <div className='skip' onClick={() => onClose()}>{LANG.work_offline}</div>
            </div>
        );
    }

    const handleLogin = async () => {
        const email = emailInput.current.value;
        const password = passwordInput.current.value;
        await signOut();
        let res = await signIn({
            email,
            password,
        });
        if (res.error) {
            return;
        }
        if (res.status === 'error') {
            if (res.info === 'USER_NOT_FOUND') {
                alert.popUpError({ message: LANG.incorrect });
            } else if (res.info === 'NOT_VERIFIED') {
                alert.popUpError({ message: LANG.not_verified });
            } else {
                alert.popUpError({ message: res.message });
            }
            return;
        }
        if (res.status === 'ok') {
            console.log('Log in succeeded', res);
            alert.popUp({ message: LANG.login_success });
            onClose();
        }
    };

    return (
        <Modal>
            <div className='flux-login'>
                <div className='title'>{LANG.login}</div>
                {/* <div className='sub-title'>{LANG.unlock_shape_library}</div> */}
                {renderOAuthContent()}
                {renderSeperator()}
                {renderLoginInputs()}
                {renderFooterButtons()}
            </div>
        </Modal>
    );
};

export default FluxIdLogin;
