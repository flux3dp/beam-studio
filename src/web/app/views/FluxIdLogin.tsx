import alert from 'app/actions/alert-caller';
import dialog from 'app/actions/dialog-caller';
import Modal from 'app/widgets/Modal';
import ShowablePasswordInput from 'app/widgets/Showable-Password-Input';
import { externalLinkFBSignIn, signIn, signOut } from 'helpers/api/flux-id';
import storage from 'helpers/storage-helper';
import i18n from 'helpers/i18n';

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
        return () => {
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
                <div className={classNames('button google')}>
                    {'Continue with Google'}
                </div>
            </div>
        );
    };

    const renderSeperator = () => {
        return <div className='sep'>{'or'}</div>;
    };

    const renderLoginInputs = () => {
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
                    <div className='forget-password' onClick={() => console.log('TODO: open forget password page')}>{LANG.forget_password}</div>
                </div>
            </div>
        );
    };

    const renderFooterButtons = () => {
        return (
            <div className='footer'>
                <div className={classNames('button', 'primary')} onClick={handleLogin}>{LANG.login}</div>
                <div className={classNames('button')} onClick={() => console.log('TODO: open regis page')}>{LANG.register}</div>
                <div className='skip' onClick={() => onClose()}>{LANG.offline}</div>
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
                alert.popUpError({ message: 'Email or password incorrect.' });
            } else if (res.info === 'NOT_VERIFIED') {
                alert.popUpError({ message: 'Account has not verified yet.' });
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
                {renderOAuthContent()}
                {renderSeperator()}
                {renderLoginInputs()}
                {renderFooterButtons()}
            </div>
        </Modal>
    );
};

export default FluxIdLogin;

// Avoid circular import
export const showLoginDialog = (callback?: () => void) => {
    if (dialog.isIdExist('flux-id-login')) return;
    dialog.addDialogComponent('flux-id-login',
        <FluxIdLogin
            onClose={() => {
                dialog.popDialogById('flux-id-login');
                if (callback) callback();
            }}
        />
    );
}
