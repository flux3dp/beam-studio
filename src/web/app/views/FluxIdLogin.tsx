import alert from 'app/actions/alert-caller';
import dialog from 'app/actions/dialog-caller';
import Modal from 'app/widgets/Modal';
import ShowablePasswordInput from 'app/widgets/Showable-Password-Input';
import { signIn, externalLinkFBSignIn, signOut } from 'helpers/api/flux-id';

const classNames = requireNode('classnames');
const React = requireNode('react');
const { useRef, useState } = requireNode('react');

const FluxIdLogin = ({ onClose }) => {
    const emailInput = useRef(null);
    const passwordInput = useRef(null);
    const [isRememberMeChecked, setIsRememberMeChecked] = useState(false);

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
                    placeholder={'t電子信箱'} 
                    ref={emailInput}
                    onKeyDown={(e: KeyboardEvent) => e.stopPropagation()}
                />
                <ShowablePasswordInput
                    id = {'password-input'}
                    ref={passwordInput}
                    placeholder={'t密碼'}
                />
                <div className='options'>
                    <div className='remember-me' onClick={() => setIsRememberMeChecked(!isRememberMeChecked)}>
                        <input type='checkbox' checked={isRememberMeChecked} onChange={() => {}}/>
                        <div>{'t勿忘我'}</div>
                    </div>
                    <div className='forget-password' onClick={() => console.log('ToDo: open forget password page')}>{'t忘記密碼'}</div>
                </div>
            </div>
        );
    };

    const renderFooterButtons = () => {
        return (
            <div className='footer'>
                <div className={classNames('button', 'primary')} onClick={handleLogin}>{'t登入'}</div>
                <div className={classNames('button')} onClick={() => console.log('ToDo: open regis page')}>{'t註冊新帳號'}</div>
                <div className='skip' onClick={() => onClose()}>{'t我要離線使用'}</div>
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
            onClose();
        }
    };

    return (
        <Modal>
            <div className='flux-login'>
                <div className='title'>{'登入'}</div>
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
