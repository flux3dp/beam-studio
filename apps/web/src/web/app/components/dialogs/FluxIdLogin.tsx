import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { Button, Divider, Form, Input, InputRef, Space } from 'antd';

import alert from 'app/actions/alert-caller';
import browser from 'implementations/browser';
import dialogCaller from 'app/actions/dialog-caller';
import isFluxPlusActive from 'helpers/is-flux-plus-active';
import storage from 'implementations/storage';
import useI18n from 'helpers/useI18n';
import {
  externalLinkFBSignIn,
  externalLinkGoogleSignIn,
  fluxIDEvents,
  signIn,
  signOut,
} from 'helpers/api/flux-id';
import { useIsMobile } from 'helpers/system-helper';

import FluxPlusModal from './FluxPlusModal';
import styles from './FluxIdLogin.module.scss';

interface Props {
  silent: boolean;
  onClose: () => void;
}

const FluxIdLogin = ({ silent, onClose }: Props): JSX.Element => {
  const lang = useI18n().flux_id_login;

  const emailInput = useRef<InputRef>(null);
  const passwordInput = useRef<InputRef>(null);
  const [isRememberMeChecked, setIsRememberMeChecked] = useState(
    !!storage.get('keep-flux-id-login')
  );
  const isMobile = useIsMobile();

  useEffect(() => {
    fluxIDEvents.on('oauth-logged-in', onClose);
    return () => {
      fluxIDEvents.removeListener('oauth-logged-in', onClose);
    };
  }, [onClose]);

  const renderOAuthContent = () => (
    <div className={styles.oauth}>
      <div className={classNames(styles.button, styles.facebook)} onClick={externalLinkFBSignIn}>
        Continue with Facebook
      </div>
      <div className={classNames(styles.button, styles.google)} onClick={externalLinkGoogleSignIn}>
        Continue with Google
      </div>
    </div>
  );

  const handleLogin = async () => {
    const email = emailInput.current.input.value;
    const password = passwordInput.current.input.value;
    await signOut();
    const res = await signIn({
      email,
      password,
      expires_session: !isRememberMeChecked,
    });
    if (res.error) {
      return;
    }
    if (res.status === 'error') {
      if (res.info === 'USER_NOT_FOUND') {
        alert.popUpError({ message: lang.incorrect });
      } else if (res.info === 'NOT_VERIFIED') {
        alert.popUpError({ message: lang.not_verified });
      } else {
        alert.popUpError({ message: res.message });
      }
      return;
    }
    if (res.status === 'ok') {
      // eslint-disable-next-line no-console
      console.log('Log in succeeded', res);
      storage.set('keep-flux-id-login', isRememberMeChecked);
      onClose();
      if (!silent) {
        dialogCaller.showFluxCreditDialog();
      }
    }
  };

  return (
    <FluxPlusModal className={styles['flux-login']} onClose={onClose} hideMobileBanner>
      <>
        <div className={styles.title}>{lang.login}</div>
        {renderOAuthContent()}
        <Divider>or</Divider>
        <Form className={styles['login-inputs']}>
          <Form.Item name="email-input">
            <Input
              ref={emailInput}
              onKeyDown={(e: React.KeyboardEvent) => e.stopPropagation()}
              placeholder={lang.email}
            />
          </Form.Item>
          <Form.Item name="password-input">
            <Input.Password
              ref={passwordInput}
              onKeyDown={(e: React.KeyboardEvent) => e.stopPropagation()}
              placeholder={lang.password}
            />
          </Form.Item>
          <div className={styles.options}>
            <div
              className={styles['remember-me']}
              onClick={() => setIsRememberMeChecked(!isRememberMeChecked)}
            >
              <input
                type="checkbox"
                checked={isRememberMeChecked}
                onChange={() => {}}
              />
              <div>{lang.remember_me}</div>
            </div>
            <div
              className={styles['forget-password']}
              onClick={() => browser.open(lang.lost_password_url)}
            >
              {lang.forget_password}
            </div>
          </div>
        </Form>
        <Space className={styles.footer} direction="vertical">
          <Button block type="primary" onClick={handleLogin}>
            {lang.login}
          </Button>
          <Button block type="default" onClick={() => browser.open(lang.signup_url)}>
            {lang.register}
          </Button>
          <div className={styles.text}>
            <div onClick={() => onClose()}>{lang.work_offline}</div>
            {isFluxPlusActive && isMobile && (
              <div onClick={() => browser.open(lang.flux_plus.website_url)}>
                {lang.flux_plus.explore_plans}
              </div>
            )}
          </div>
        </Space>
      </>
    </FluxPlusModal>
  );
};

export default FluxIdLogin;
